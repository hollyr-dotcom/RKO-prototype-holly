"use client";

import { Tldraw, Editor, createShapeId, createBindingId, toRichText, renderHtmlFromRichTextForMeasurement, TLShapeId, DefaultFontStyle, DefaultSizeStyle, DefaultDashStyle, DefaultFillStyle, TLGridProps, DefaultColorStyle, DefaultColorThemePalette } from "tldraw";
import "tldraw/tldraw.css";

// ── Override tldraw sticky colors with Miro DS canvas sticky tokens ──
// Uses the official Miro sticky background colors (canvas-*-400 scale).
const light = DefaultColorThemePalette.lightMode;
light.yellow.noteFill    = "#FFE86D"; light.yellow.noteText    = "#231E0C";   // sunshine-400 / yellow-950
light.orange.noteFill    = "#FFF79E"; light.orange.noteText    = "#231E0C";   // sunshine-250 (light) / yellow-950
light.green.noteFill     = "#6AE08D"; light.green.noteText     = "#02400F";   // moss-400 / moss-900
light["light-green"].noteFill = "#B3E65F"; light["light-green"].noteText = "#21370B"; // lime-400 / lime-900
light.blue.noteFill      = "#86B4F9"; light.blue.noteText      = "#001D66";   // ocean-400 / ocean-900
light["light-blue"].noteFill  = "#B2D0FE"; light["light-blue"].noteText  = "#001D66"; // ocean-250 / ocean-900
light.violet.noteFill    = "#B8ACFB"; light.violet.noteText    = "#20084F";   // lilac-400 / violet-900
light["light-violet"].noteFill = "#FD9AE7"; light["light-violet"].noteText = "#55055C"; // pink-400 / pink-900
light.red.noteFill       = "#FF9E9E"; light.red.noteText       = "#600000";   // coral-400 / coral-900
light["light-red"].noteFill   = "#81E7DE"; light["light-red"].noteText   = "#0E4343"; // teal-400 / teal-900
light.grey.noteFill      = "#CFCFCF"; light.grey.noteText      = "#333333";   // coal-400 / coal-900
light.black.noteFill     = "#151515"; light.black.noteText     = "#FFFFFF";   // black / white
light.white.noteFill     = "#FFFFFF"; light.white.noteText     = "#34363E";   // white / gray-800
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Message } from "@/hooks/useAgent";
import { useChat } from "@/hooks/useChat";
import { useSidebar } from "@/hooks/useSidebar";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { useStorageStore } from "@/hooks/useStorageStore";
import { generateId, getSessionUser, getLocalDevUser } from "@/lib/userIdentity";
import { useAuth } from "@/hooks/useAuth";
import { DocumentShapeUtil } from "@/shapes/DocumentShapeUtil";
import { DataTableShapeUtil } from "@/shapes/DataTableShapeUtil";
import { CommentShapeUtil } from "@/shapes/CommentShapeUtil";
import { TaskCardShapeUtil } from "@/shapes/TaskCardShapeUtil";
import { GanttChartShapeUtil } from "@/shapes/GanttChartShapeUtil";
import { KanbanBoardShapeUtil } from "@/shapes/KanbanBoardShapeUtil";
import { ApproveButtonShapeUtil } from "@/shapes/ApproveButtonShapeUtil";
import { PeopleListShapeUtil } from "@/shapes/PeopleListShapeUtil";
import { WorkdayCardShapeUtil } from "@/shapes/WorkdayCardShapeUtil";
import { SlackCardShapeUtil } from "@/shapes/SlackCardShapeUtil";
import { Toolbar } from "./toolbar/Toolbar";
import { StartingPromptCards } from "./StartingPromptCards";
import { CanvasComments } from "./CanvasComments";
import { CanvasMasthead } from "./CanvasMasthead";
import {
  IconSingleSparksFilled,
  IconViewSideRight,
  IconArrowLeft,
  IconCross,
  IconArrowRight,
  IconSquarePencil,
  IconCheckMark,
  IconNotepad,
} from "@mirohq/design-system-icons";
import { calculateLayout } from "@/lib/layoutEngine";
import type { LayoutType, LayoutItem, LayoutOptions } from "@/types/layout";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import { FocusModeOverlay, FocusedShape } from "./FocusModeOverlay";
import { FloatingQuestionCard } from "./FloatingQuestionCard";
import { setFocusedDocId } from "@/lib/focusModeStore";
import { PlacementEngine, getCategoryForTool } from "@/lib/placementEngine";
import { ConnectorHandles } from "./ConnectorHandles";

// Animation variants
const sidebarVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

const floatingCardVariants = {
  hidden: { opacity: 0, y: 12, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 8, scale: 0.98 },
};

const toastVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 12 },
};

const fullscreenVariants = {
  hidden: { x: "100%" },
  visible: { x: 0 },
  exit: { x: "100%" },
};

const planPanelVariants = {
  hidden: { x: "100%", opacity: 0 },
  visible: { x: 0, opacity: 1 },
  exit: { x: "100%", opacity: 0 },
};

const smoothTransition = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number], duration: 0.25 };
const floatingTransition = { type: "tween" as const, ease: [0.25, 0.1, 0.25, 1.0] as [number, number, number, number], duration: 0.22 };

// Audio chimes for voice mode


// Floating thinking indicator
function FloatingThinkingIndicator({ status = "Thinking..." }: { status?: string }) {
  return (
    <div>
      <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg border border-gray-200">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
        <span className="text-sm text-gray-600">{status}</span>
      </div>
    </div>
  );
}

// Floating voice indicator
// Floating question card (Claude Cowork style)
// Floating plan approval toast (simple, like checkpoint)
function FloatingPlanApproval({
  title,
  onApprove,
  onViewDetails,
}: {
  title: string;
  onApprove: () => void;
  onViewDetails: () => void;
}) {
  return (
    <div className="w-[420px]">
      <div
        onClick={onViewDetails}
        className="flex items-center gap-3 bg-white text-gray-900 shadow-lg border border-gray-200 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ borderRadius: '32px', paddingTop: '16px', paddingBottom: '16px' }}
      >
        {/* Icon */}
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 text-blue-600">
          <IconNotepad css={{ width: 14, height: 14 }} />
        </div>

        {/* Title */}
        <span className="text-sm font-medium flex-1 truncate">
          <span className="text-gray-500">Plan:</span> {title}
        </span>

        {/* Approve button */}
        <button
          onClick={(e) => { e.stopPropagation(); onApprove(); }}
          className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-full hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          Approve
        </button>
      </div>
    </div>
  );
}

// Floating progress indicator when chat panel is closed
function FloatingProgressIndicator({
  messages,
  isLoading,
  onOpenPanel,
  onSubmit,
  editor,
  hasToast = false,
  isCompletionDismissed,
  setIsCompletionDismissed,
}: {
  messages: Message[];
  isLoading: boolean;
  onOpenPanel: () => void;
  onSubmit: (text: string, options?: { openPanel?: boolean }) => void;
  editor: Editor;
  hasToast?: boolean;
  isCompletionDismissed: boolean;
  setIsCompletionDismissed: (dismissed: boolean) => void;
}) {

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

  // ── Connector cycling animation at start of execution ──
  // Uses elapsed time from a stable start timestamp (not fragile setTimeout timers)
  const connectorSources: { name: string; icon: React.ReactNode }[] = [
    { name: "Jira", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.202 2H12c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C18.85 10.13 20.708 12 23 12V2.803A.803.803 0 0021.202 2z" fill="#9ca3af"/><path d="M16.202 7H7c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C13.85 15.13 15.708 17 18 17V7.803A.803.803 0 0016.202 7z" fill="#9ca3af"/><path d="M11.202 12H2c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C8.85 20.13 10.708 22 13 22v-9.197A.803.803 0 0011.202 12z" fill="#9ca3af"/></svg> },
    { name: "Miro Insights", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M15 2a3 3 0 013 3v1.618l2.105.371a3 3 0 012.434 3.476l-1.736 9.849a3 3 0 01-3.476 2.433L7.48 21.01A3 3 0 015.001 18 3 3 0 012 15V5a3 3 0 013-3h10zm3 13a3 3 0 01-3 3H7.003a1 1 0 00.824 1.041l9.848 1.736a1 1 0 001.158-.811l1.736-9.848a1 1 0 00-.81-1.159L18 8.649V15zM5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5z" fill="#9ca3af"/></svg> },
    { name: "Salesforce", icon: <svg width="14" height="14" viewBox="0 0 512 512" fill="none"><path d="M481 239.1c0 61.6-56.3 108.6-116.3 95.9-12.9 23.2-49.7 49.7-93 29.3-28.9 67.5-125.1 64.8-150.3-3.6C37.3 377.5-4.3 263.4 68.5 220.6 44.1 164.7 84.4 98.5 148.9 98.5c27.2 0 52.8 12.7 69.3 34.2 14.6-15 34.7-24.5 57.1-24.5 29.8 0 55.5 16.5 69.5 41.2C410 120.8 481 169.3 481 239.1z" fill="#9ca3af"/></svg> },
    { name: "Asana", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path fillRule="evenodd" clipRule="evenodd" d="M17.65 12.62a4.35 4.35 0 100 8.7 4.35 4.35 0 000-8.7zm-11.3 0a4.35 4.35 0 100 8.7 4.35 4.35 0 000-8.7zM16.35 7.183a4.35 4.35 0 11-8.7 0 4.35 4.35 0 018.7 0z" fill="#9ca3af"/></svg> },
    { name: "Google Drive", icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6.835 21l3.08-6h12.072L18.656 21H6.835zM15.325 14h6.662L15.325 3H8.662l6.663 11zM2 15l3.331 6 5.663-11L7.662 4 2 15z" fill="#9ca3af"/></svg> },
    { name: "Looker", icon: null },
    { name: "Amplitude", icon: null },
    { name: "GitHub", icon: null },
  ];
  const [animStart, setAnimStart] = useState(0);
  const [, setTick] = useState(0);

  const isExecuting = activePlan?.isExecuting ?? false;

  // Record start time once when execution begins (persists through re-render flickers)
  useEffect(() => {
    if (isExecuting && animStart === 0) {
      setAnimStart(Date.now());
    }
  }, [isExecuting, animStart]);

  // Reset when plan disappears entirely
  useEffect(() => {
    if (!activePlan) setAnimStart(0);
  }, [activePlan]);

  // Tick every second during the 20s animation window to force re-renders
  useEffect(() => {
    if (animStart === 0) return;
    const id = setInterval(() => {
      if (Date.now() - animStart < 21000) {
        setTick(t => t + 1);
      } else {
        clearInterval(id);
      }
    }, 1000);
    return () => clearInterval(id);
  }, [animStart]);

  // Don't show if no active plan
  if (!activePlan) return null;

  const stepNumber = activePlan.currentStep + 1;
  const totalSteps = activePlan.steps.length;
  const rawStepText = activePlan.steps[activePlan.currentStep] || "";
  const isComplete = stepNumber >= totalSteps && !isLoading;

  // Check if canvas creation tools have started (zones, frames, etc.)
  // Once creation starts, skip the connector cycling and show real step progress
  const hasCanvasCreationStarted = messages.some(m =>
    m.role === 'assistant' && m.toolInvocations?.some(t =>
      ["createZone", "createFrame", "createLayout", "createCanvas", "createDocument", "createDataTable", "createSources"].includes(t.toolName)
    )
  );

  // Derive displayed step text from elapsed animation time
  // Only show connector cycling before canvas creation tools arrive
  const elapsed = animStart > 0 ? Date.now() - animStart : 0;
  let currentStepText = rawStepText;
  let connectorIcon: React.ReactNode = null;
  if (!hasCanvasCreationStarted) {
    if (elapsed > 0 && elapsed < 2000) {
      currentStepText = "Finding relevant data…";
    } else if (elapsed >= 2000 && elapsed < 20000) {
      const idx = Math.floor((elapsed - 2000) / 4000) % connectorSources.length;
      currentStepText = `Connecting to ${connectorSources[idx].name}…`;
      connectorIcon = connectorSources[idx].icon;
    }
  }

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
      <div className="absolute left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 bottom-28">
        <div className="flex items-center gap-2 bg-green-600 text-white shadow-lg px-4 py-3 pb-3.5 w-[420px]" style={{ borderRadius: 24 }}>
          {/* Checkmark icon */}
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <IconCheckMark css={{ width: 20, height: 20, color: 'white' }} />
          </div>

          <span className="text-sm font-medium flex-1">Plan completed</span>

          {/* Close button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setIsCompletionDismissed(true);
            }}
            className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
          >
            <IconCross css={{ width: 14, height: 14 }} />
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
      <div className="absolute left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 bottom-28">
        <div
          onClick={handleReviewBatch}
          className="bg-blue-600 text-white shadow-lg overflow-hidden w-[420px] hover:bg-blue-700 transition-colors cursor-pointer"
          style={{ borderRadius: 24 }}
        >
          {/* Progress bar at top */}
          <div className="h-1 w-full bg-blue-800">
            <div className="h-full bg-blue-300 transition-all duration-300" style={{ width: `${progress}%` }} />
          </div>

          <div className="flex items-center gap-2 px-4" style={{ paddingTop: '12px', paddingBottom: '16px' }}>
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
              className="ml-2 px-4 py-1.5 text-sm font-medium bg-white text-blue-600 rounded-full hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              Continue
            </button>

            {/* Close button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSubmit("Continue", { openPanel: false });
              }}
              onMouseEnter={(e) => e.stopPropagation()}
              onMouseLeave={(e) => e.stopPropagation()}
              className="ml-1 w-6 h-6 rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors flex-shrink-0"
              title="Dismiss"
            >
              <IconCross css={{ width: 14, height: 14 }} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = (stepNumber / totalSteps) * 100;

  return (
    <div className="absolute left-1/2 -translate-x-1/2 z-50 transition-all duration-300 bottom-28">
      <button
        onClick={onOpenPanel}
        className="flex flex-col bg-gray-100 text-gray-900 shadow-md hover:bg-gray-200 transition-colors overflow-hidden w-[420px]"
        style={{ borderRadius: 24 }}
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

          {/* Step text — shimmer animation while executing */}
          <span
            className="text-sm font-medium truncate flex-1 min-w-0 text-left flex items-center gap-1.5"
            style={isLoading ? {
              background: 'linear-gradient(90deg, #9ca3af 0%, #9ca3af 40%, #d1d5db 50%, #9ca3af 60%, #9ca3af 100%)',
              backgroundSize: '200% 100%',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              animation: 'shimmer-text 2s ease-in-out infinite',
            } : undefined}
          >
            {connectorIcon && <span className="flex-shrink-0 flex items-center" style={{ WebkitTextFillColor: 'initial' }}>{connectorIcon}</span>}
            {currentStepText}
          </span>

          {/* Open sidebar icon - only show when not actively working */}
          {!isLoading && (
            <span className="text-gray-400 flex-shrink-0 flex items-center justify-center">
              <IconViewSideRight size="small" />
            </span>
          )}
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

// Sticky note color palette — Miro DS canvas sticky colors
const STICKY_COLOR_PALETTE: TLColor[] = [
  "yellow",       // sunshine-400: #FFE86D
  "light-red",    // teal-400: #81E7DE
  "light-violet", // pink-400: #FD9AE7
  "violet",       // lilac-400: #B8ACFB
  "light-blue",   // cyan-400: #9CE6FF
];

function randomStickyColor(): TLColor {
  return STICKY_COLOR_PALETTE[Math.floor(Math.random() * STICKY_COLOR_PALETTE.length)];
}

type CreationToastInfo = {
  id: string; // unique key per tool call
  name: string;
  type: "board" | "frame" | "items" | "document" | "table" | "task";
  isCreating: boolean;
  canvasId?: string;
  frameName?: string;
};

// Measure document height by rendering HTML in a hidden DOM element.
// Random slight rotation for sticky notes (-3° to 3°)
function noteRotation(): number {
  return (Math.random() * 6 - 3) * (Math.PI / 180);
}

// Uses the exact same styles as the document component (74px padding, 13px font, 1.6 line-height).
// This is synchronous and pixel-accurate — no estimation.
function measureDocumentHeight(html: string, shapeWidth: number = 780, minHeight: number = 200): number {
  if (typeof document === "undefined") {
    // SSR fallback — rough estimate
    const text = html.replace(/<[^>]+>/g, "");
    return Math.max(minHeight, Math.ceil(text.length / 50) * 21 + 200);
  }

  const el = document.createElement("div");
  el.style.cssText = `
    position:absolute; left:-9999px; top:0;
    width:${shapeWidth}px; box-sizing:border-box;
    padding:74px; font-size:13px; line-height:1.6; color:#1f2937;
    word-wrap:break-word; overflow-wrap:break-word;
  `;
  // Inject Tiptap-matching heading/paragraph styles so measurement is pixel-accurate
  el.innerHTML = `<style>
    h1 { font-size:1.4em; font-weight:700; margin:1.2em 0 0.5em; line-height:1.3; }
    h2 { font-size:1.2em; font-weight:600; margin:1.4em 0 0.5em; line-height:1.3; }
    h3 { font-size:1.05em; font-weight:600; margin:1em 0 0.4em; line-height:1.3; }
    h1:first-child, h2:first-child, h3:first-child { margin-top:0; }
    p { margin:0 0 0.6em; line-height:1.55; }
    ul, ol { margin:0 0 0.6em; padding-left:1.5em; }
    li { margin:0 0 0.2em; }
    blockquote { margin:0.5em 0; padding-left:1em; border-left:3px solid #ddd; }
  </style>${html}`;
  document.body.appendChild(el);
  const h = el.scrollHeight;
  document.body.removeChild(el);

  // scrollHeight already includes the 74px top+bottom padding. No extra chrome needed.
  return Math.max(h, minHeight);
}

const BASE_SPACING = 25;
const MIN_SCREEN_PX = 16;

function CustomGrid({ x, y, z }: TLGridProps) {
  // Scale the spacing so dots never get too dense on screen
  let step = BASE_SPACING;
  while (step * z < MIN_SCREEN_PX) step *= 2;

  const s = step * z;
  const xo = 0.5 + x * z;
  const yo = 0.5 + y * z;
  const gxo = xo > 0 ? xo % s : s + (xo % s);
  const gyo = yo > 0 ? yo % s : s + (yo % s);
  return (
    <svg className="tl-grid" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <defs>
        <pattern id="grid-dot" width={s} height={s} patternUnits="userSpaceOnUse">
          <circle cx={gxo} cy={gyo} r={1} fill="rgba(0,0,0,0.15)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid-dot)" />
    </svg>
  );
}

function CustomBackground() {
  return <div style={{ position: 'absolute', inset: 0, backgroundColor: '#f8f8f8' }} />;
}

const tldrawComponents = { Grid: CustomGrid, Background: CustomBackground, OnTheCanvas: ConnectorHandles };

export function Canvas() {
  // Get authenticated user
  const { user: authUser } = useAuth();

  // LiveBlocks multiplayer store -- syncs tldraw state across users
  const [sessionUser] = useState(() => authUser ? getSessionUser(authUser) : getLocalDevUser());
  const customShapeUtils = useMemo(() => [DocumentShapeUtil, DataTableShapeUtil, CommentShapeUtil, TaskCardShapeUtil, GanttChartShapeUtil, KanbanBoardShapeUtil, ApproveButtonShapeUtil, PeopleListShapeUtil, WorkdayCardShapeUtil, SlackCardShapeUtil], []);
  const storeWithStatus = useStorageStore({ shapeUtils: customShapeUtils, user: sessionUser });

  // Prevent browser back/forward navigation from trackpad gestures (Safari + fallback)
  useEffect(() => {
    // Push a guard state so "back" stays on this page
    window.history.pushState({ canvasGuard: true }, "");
    const handlePopState = (e: PopStateEvent) => {
      // Re-push to block the navigation
      window.history.pushState({ canvasGuard: true }, "");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  // Prevent browser zoom (pinch-to-zoom + Ctrl+scroll + Ctrl+/-)
  // tldraw handles canvas zoom itself; browser zoom just breaks the UI
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")) {
        e.preventDefault();
      }
    };
    document.addEventListener("wheel", handleWheel, { passive: false });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("wheel", handleWheel);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const [editor, setEditor] = useState<Editor | null>(null);
  const [responseToast, setResponseToast] = useState<string | null>(null);
  const [toastCentered, setToastCentered] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isToolbarMultiLine, setIsToolbarMultiLine] = useState(false);
  const [isPlusMenuOpen, setIsPlusMenuOpen] = useState(false);
  const [isInQAFlow, setIsInQAFlow] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [dismissedPlan, setDismissedPlan] = useState(false);
  const [isCompletionDismissed, setIsCompletionDismissed] = useState(false);
  const [shapeCount, setShapeCount] = useState(0);
  const [areSuggestionsVisible, setAreSuggestionsVisible] = useState(false);
  const [hasToolbarText, setHasToolbarText] = useState(false);
  const [isCommentMode, setIsCommentMode] = useState(false);
  const [focusedShape, setFocusedShape] = useState<FocusedShape | null>(null);
  const wasLoadingRef = useRef(false);
  const createdShapesRef = useRef<TLShapeId[]>([]);
  const placementEngineRef = useRef<PlacementEngine | null>(null);
  const isProcessingToolCallRef = useRef(false);

  // Streaming tool call tracking — shapes created incrementally as model generates
  const streamingLayoutsRef = useRef<Map<string, {
    frameId: TLShapeId;
    columns: number;
    type: string;
    isGrid: boolean;
    itemWidth: number;
    shapeHeight: number;
    gapX: number;
    gapY: number;
    padding: number;
    titleSpace: number;
    itemCount: number;
    pendingItems?: Record<string, unknown>[]; // For hierarchy/flow: items accumulated during streaming
  }>>(new Map());
  const streamingDocsRef = useRef<Map<string, { shapeId: TLShapeId }>>(new Map());
  const streamingTablesRef = useRef<Map<string, { shapeId: TLShapeId; columns: string[]; rowCount: number; accumulatedRows: string[][] }>>(new Map());
  const userEditsRef = useRef<Array<{ shapeId: string; field: string; oldValue: string; newValue: string }>>([]);
  const shouldHideToastRef = useRef(false); // Track if toast should be hidden during new request
  const voiceRef = useRef<{ isConnected: boolean; sendCanvasUpdate: () => void; sendScreenshot: (changeDescription?: string) => void } | null>(null);
  const [creationToasts, setCreationToasts] = useState<CreationToastInfo[]>([]);
  const lastCreationToastedRef = useRef<string | null>(null);

  // Chat from provider — must be before any callbacks that use setChatMode, append, etc.
  const { messages, append, isLoading, setMessages, registerHandlers, chatMode, setChatMode, input, setInput, setActiveCanvas, navigateToCanvas } = useChat();
  const isChatOpen = chatMode === "sidepanel";
  const isFullscreenChat = chatMode === "fullscreen";
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const screenshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScreenshotShapeIdsRef = useRef<Set<string>>(new Set());
  const waitingForGoodbyeRef = useRef(false);
  const goodbyeTranscriptLengthRef = useRef(0); // Track goodbye message length for audio timing
  const hasPlayedStartChimeRef = useRef(false); // Track if start chime played for this session

  // App sidebar width (for positioning toolbar/elements)
  const { navWidth: appSidebarWidth } = useSidebar();

  // Voice mode with OpenAI Realtime API
  const voice = useRealtimeVoice();

  // Keep voiceRef in sync for use in callbacks
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  // Handle sidebar close (instant, no animation)
  const handleCloseChat = useCallback((dismissPlan = true) => {
    setChatMode("minimized");
    if (dismissPlan) {
      // X button = close completely, hide ALL floating UI
      setResponseToast(null);
      setToastCentered(false);
      setCreationToasts([]);
      lastCreationToastedRef.current = null;
      setDismissedPlan(true); // Mark plan as dismissed so it doesn't float back
      setIsInQAFlow(false); // Exit Q&A flow to restore hybrid toolbar
    }
    // (Minus button handles restoration explicitly in onCollapse)
  }, [setChatMode]);

  // Navigate to shapes by name/title - zooms to fit all matching shapes
  const navigateToFrames = useCallback((names: string[]) => {
    if (!editor || names.length === 0) return;

    const shapes = editor.getCurrentPageShapes();
    // Search frames by props.name, documents/datatables by props.title
    const matchingFrames = shapes.filter(s => {
      const props = s.props as Record<string, unknown>;
      const shapeName = (props.name as string) || (props.title as string) || "";
      return names.some(n => shapeName.includes(n));
    });

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

  // Smart placement engine — arranges content like a human whiteboard
  const getPlacementEngine = useCallback(() => {
    if (!editor) return new PlacementEngine(null as any);
    if (!placementEngineRef.current) {
      placementEngineRef.current = new PlacementEngine(editor);
      placementEngineRef.current.initialize();
    }
    return placementEngineRef.current;
  }, [editor]);

  // Re-initialize placement engine when a new AI response starts
  useEffect(() => {
    if (isLoading && editor) {
      console.log("[PlacementEngine] Re-initializing (isLoading=true)");
      placementEngineRef.current = new PlacementEngine(editor);
      placementEngineRef.current.initialize();
    }
  }, [isLoading, editor]);

  // Capture canvas screenshot for initial voice connect context
  // Uses tldraw's export API (WebGL canvas is blank when read directly)
  // Skips bookmarks + their parent frames (external URLs cause CORS errors in SVG export)
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (!editor) return null;

    try {
      const allShapes = editor.getCurrentPageShapes();

      // Frames that contain bookmarks must be excluded too —
      // exporting a frame renders ALL its children including bookmarks
      const framesWithBookmarks = new Set(
        allShapes
          .filter(s => s.type === 'bookmark')
          .map(s => s.parentId as string)
      );

      const exportable = allShapes.filter(s =>
        s.type !== 'bookmark' &&
        !framesWithBookmarks.has(s.id as string)
      );
      if (exportable.length === 0) return null;

      const { url } = await editor.toImageDataUrl(
        exportable.map(s => s.id),
        {
          format: 'jpeg',  // JPEG is much smaller than PNG
          quality: 0.6,     // 60% quality - good balance of size vs clarity for AI vision
          pixelRatio: 1
        }
      );

      // Log size for debugging
      const sizeKB = Math.round(url.length / 1024);
      console.log(`[SCREENSHOT] Captured JPEG: ${sizeKB}KB`);

      return url;
    } catch (err) {
      console.error('[CANVAS] Screenshot capture failed:', err);
      return null;
    }
  }, [editor]);

  // Helper: extract text from tldraw richText prop
  const extractText = useCallback((props: Record<string, unknown>): string | undefined => {
    if (!props.richText) return undefined;
    const richText = props.richText as { content?: Array<{ content?: Array<{ text?: string }> }> };
    return richText.content
      ?.flatMap((block) => block.content?.map((inline) => inline.text) || [])
      .join("") || undefined;
  }, []);

  // Get canvas state for agent context - structured with frames, children, arrows
  const getCanvasState = useCallback(() => {
    if (!editor) return { frames: [], orphans: [], arrows: [] };
    try { const shapes = editor.getCurrentPageShapes();

    // Build shape info lookup
    const shapeInfo = (shape: typeof shapes[number]) => {
      const props = shape.props as Record<string, unknown>;
      const bounds = editor.getShapeGeometry(shape.id).bounds;
      const meta = shape.meta as Record<string, unknown>;

      // Bookmarks store title/URL in their asset, not in richText
      let text = extractText(props);
      let url: string | undefined;
      if (shape.type === 'bookmark') {
        url = props.url as string | undefined;
        const assetId = props.assetId as string | undefined;
        if (assetId) {
          const asset = editor.getAsset(assetId as any);
          if (asset) {
            const assetProps = asset.props as Record<string, unknown>;
            text = (assetProps.title as string) || url || 'bookmark';
          }
        }
      }

      // Documents: extract title + plain-text content from meta.contentText
      // (contentText is kept in sync by DocumentEditor on every save)
      if (shape.type === 'document') {
        const title = props.title as string | undefined;
        const contentText = meta?.contentText as string | undefined;
        if (contentText) {
          text = title ? `${title}: ${contentText.slice(0, 300)}` : contentText.slice(0, 300);
        } else if (title) {
          text = title;
        }
      }

      // Data tables: extract column names + row preview from meta
      if (shape.type === 'datatable') {
        const title = props.title as string | undefined;
        const rawTableData = meta?.initialData;
        const tableData = typeof rawTableData === "string" ? (() => { try { return JSON.parse(rawTableData); } catch { return undefined; } })() as { columns: string[]; rows: string[][] } | undefined : rawTableData as { columns: string[]; rows: string[][] } | undefined;
        if (tableData) {
          const cols = tableData.columns.join(', ');
          const rowPreview = tableData.rows.slice(0, 3).map(r => r.join(' | ')).join('; ');
          text = title
            ? `${title} [${cols}] — ${rowPreview}`
            : `[${cols}] — ${rowPreview}`;
        } else if (title) {
          text = title;
        }
      }

      // Kanban boards: extract title + lane/card counts
      if ((shape.type as string) === 'kanbanboard') {
        const kbTitle = props.title as string | undefined;
        const laneCount = (props.lanes as any[])?.length ?? 0;
        const cardCount = (props.cards as any[])?.length ?? 0;
        text = `"${kbTitle || 'Kanban Board'}" (${laneCount} lanes, ${cardCount} cards)`;
      }

      // Task cards: extract title + status + priority + assignee
      if ((shape.type as string) === 'taskcard') {
        const title = props.title as string | undefined;
        const status = props.status as string | undefined;
        const priority = props.priority as string | undefined;
        const assignee = props.assignee as string | undefined;
        const parts = [title || 'Untitled task'];
        if (status) parts.push(`status:${status}`);
        if (priority) parts.push(`priority:${priority}`);
        if (assignee) parts.push(`assignee:${assignee}`);
        text = parts.join(', ');
      }

      // Gantt charts: extract title + task preview
      if ((shape.type as string) === 'ganttchart') {
        const gcTitle = props.title as string | undefined;
        const tasks = props.tasks as Array<{ text?: string }> | undefined;
        const taskCount = tasks?.length ?? 0;
        const taskPreview = tasks?.slice(0, 5).map(t => t.text || '?').join(', ') || '';
        text = `"${gcTitle || 'Gantt Chart'}" (${taskCount} tasks${taskPreview ? ': ' + taskPreview : ''})`;
      }

      // Images: detect RECOMMENDED sticker by assetId
      if (shape.type === 'image') {
        const assetId = (props.assetId as string) || "";
        if (assetId.includes("sticker-recommended")) {
          text = "RECOMMENDED sticker";
        }
      }

      return {
        id: shape.id,
        type: shape.type,
        text,
        url,
        color: props.color as string | undefined,
        name: props.name as string | undefined,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
        createdBy: (meta?.createdBy as string) || "user",
        parentId: shape.parentId,
      };
    };

    // Separate frames from other shapes
    const frames = shapes.filter(s => s.type === "frame");
    const arrows = shapes.filter(s => s.type === "arrow");
    const pageId = editor.getCurrentPageId();

    // Build structured frames with children
    const frameData = frames.map(frame => {
      const info = shapeInfo(frame);
      const children = shapes
        .filter(s => s.parentId === frame.id && s.type !== "arrow")
        .map(shapeInfo);
      const frameArrows = shapes
        .filter(s => s.parentId === frame.id && s.type === "arrow")
        .map(shapeInfo);
      return {
        ...info,
        children,
        arrows: frameArrows,
      };
    });

    // Orphan shapes: not inside any frame, not arrows, not frames
    const orphans = shapes
      .filter(s => s.parentId === pageId && s.type !== "frame" && s.type !== "arrow")
      .map(shapeInfo);

    // Top-level arrows (not inside frames)
    const topArrows = arrows
      .filter(s => s.parentId === pageId)
      .map(shapeInfo);

    const fsId = focusedShape?.docId || focusedShape?.tableId || null;
    return { frames: frameData, orphans, arrows: topArrows, focusedShapeId: fsId };
    } catch { return { frames: [], orphans: [], arrows: [], focusedShapeId: null }; }
  }, [editor, extractText, focusedShape]);

  // Handle tool calls from the agent
  const handleToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      if (!editor) return;

      isProcessingToolCallRef.current = true;
      let shapeId: TLShapeId | null = null;

      // Helper: get a ZonePlacementEngine for placing content inside a parent frame
      const getZoneEngineForFrame = (parentFrameId: string) => {
        const frameShape = editor.getShape(parentFrameId as any);
        if (!frameShape) return null;
        const engine = getPlacementEngine();
        const w = (frameShape.props as any).w || 800;
        const h = (frameShape.props as any).h || 600;
        return engine.getZoneEngine(parentFrameId, w, h);
      };

      // Helper: after zone engine placement, resize the parent frame if content exceeds its bounds
      const maybeResizeParentFrame = (parentFrameId: string, newHeight: number | undefined) => {
        if (newHeight !== undefined) {
          editor.updateShape({ id: parentFrameId as any, type: "frame", props: { h: newHeight } });
        }
      };

      try {

      // ===== STREAMING TOOL CALL HANDLERS =====
      // These handle shapes appearing incrementally as the model generates them.
      // The _streaming_* events are sent by useAgent (chat) and useRealtimeVoice (voice).

      if (toolName === "_streaming_start") {
        const { toolName: streamToolName, callId, partialArgs } = args as {
          toolName: string;
          callId: string;
          partialArgs: Record<string, unknown>;
        };

        if (streamToolName === "createLayout") {
          const type = (partialArgs.type as string) || "grid";
          const isGrid = type === "grid" || type === undefined;
          const columns = (partialArgs.columns as number) || 3;
          const itemWidth = 220;
          const shapeHeight = 120;
          const gapX = 60;
          const gapY = 60;
          const padding = 80;
          const titleSpace = 70;

          // Estimate initial frame size (will grow as items arrive)
          const estimatedCols = Math.min(columns, 6);
          const frameWidth = padding * 2 + estimatedCols * itemWidth + (estimatedCols - 1) * gapX;
          const frameHeight = padding + titleSpace + 200 + padding; // Start small

          const parentFrameId = partialArgs.parentFrameId as string | undefined;
          let canvasPos: { x: number; y: number };

          if (parentFrameId) {
            const zoneEngine = getZoneEngineForFrame(parentFrameId);
            if (zoneEngine) {
              canvasPos = zoneEngine.place({ category: "format", width: frameWidth, height: frameHeight });
              const newH = zoneEngine.recordPlacement(`streaming-layout-${callId}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
              maybeResizeParentFrame(parentFrameId, newH);
            } else {
              const engine = getPlacementEngine();
              canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight });
              engine.recordPlacement(`streaming-layout-${callId}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
            }
          } else {
            const engine = getPlacementEngine();
            canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight });
            engine.recordPlacement(`streaming-layout-${callId}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
          }

          const frameId = createShapeId();
          editor.createShape({
            id: frameId,
            type: "frame",
            x: canvasPos.x,
            y: canvasPos.y,
            ...(parentFrameId ? { parentId: parentFrameId as any } : {}),
            props: {
              name: (partialArgs.frameName as string) || "Loading...",
              w: frameWidth,
              h: frameHeight,
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(frameId);

          streamingLayoutsRef.current.set(callId, {
            frameId, columns, type, isGrid, itemWidth, shapeHeight,
            gapX, gapY, padding, titleSpace, itemCount: 0,
          });
          // Layout frame created for streaming
        }

        if (streamToolName === "createDocument") {
          const validWidth = 780;
          const validHeight = 400; // Start small, will grow

          const parentFrameId = partialArgs.parentFrameId as string | undefined;
          let pos: { x: number; y: number };

          if (parentFrameId) {
            const zoneEngine = getZoneEngineForFrame(parentFrameId);
            if (zoneEngine) {
              pos = zoneEngine.place({ category: "format", width: validWidth, height: validHeight });
              const newH = zoneEngine.recordPlacement(`streaming-doc-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
              maybeResizeParentFrame(parentFrameId, newH);
            } else {
              const engine = getPlacementEngine();
              pos = engine.place({ category: "format", width: validWidth, height: validHeight });
              engine.recordPlacement(`streaming-doc-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
            }
          } else {
            const engine = getPlacementEngine();
            pos = engine.place({ category: "format", width: validWidth, height: validHeight });
            engine.recordPlacement(`streaming-doc-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
          }

          const docShapeId = createShapeId();
          editor.createShape({
            id: docShapeId,
            type: "document",
            x: pos.x,
            y: pos.y,
            ...(parentFrameId ? { parentId: parentFrameId as any } : {}),
            props: {
              docId: generateId(),
              title: (partialArgs.title as string) || "Writing...",
              w: validWidth,
              h: validHeight,
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(docShapeId);

          streamingDocsRef.current.set(callId, { shapeId: docShapeId });
          // Document shape created for streaming
        }

        if (streamToolName === "createDataTable") {
          const columns = (partialArgs.columns as string[]) || [];
          const title = (partialArgs.title as string) || "Loading...";
          const validWidth = Math.max(columns.length * 120 + 68, 400);
          const validHeight = 200; // Start small

          const parentFrameId = partialArgs.parentFrameId as string | undefined;
          let pos: { x: number; y: number };

          if (parentFrameId) {
            const zoneEngine = getZoneEngineForFrame(parentFrameId);
            if (zoneEngine) {
              pos = zoneEngine.place({ category: "format", width: validWidth, height: validHeight });
              const newH = zoneEngine.recordPlacement(`streaming-table-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
              maybeResizeParentFrame(parentFrameId, newH);
            } else {
              const engine = getPlacementEngine();
              pos = engine.place({ category: "format", width: validWidth, height: validHeight });
              engine.recordPlacement(`streaming-table-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
            }
          } else {
            const engine = getPlacementEngine();
            pos = engine.place({ category: "format", width: validWidth, height: validHeight });
            engine.recordPlacement(`streaming-table-${callId}`, { category: "format", width: validWidth, height: validHeight }, pos);
          }

          const tableShapeId = createShapeId();
          const tableMeta: Record<string, string> = { createdBy: "ai" };
          if (columns.length > 0) {
            tableMeta.initialData = JSON.stringify({ columns, rows: [] });
          }
          // DataTable shape created for streaming
          editor.createShape({
            id: tableShapeId,
            type: "datatable",
            x: pos.x,
            y: pos.y,
            ...(parentFrameId ? { parentId: parentFrameId as any } : {}),
            props: {
              tableId: generateId(),
              title,
              w: validWidth,
              h: validHeight,
            },
            meta: tableMeta,
          });
          createdShapesRef.current.push(tableShapeId);

          streamingTablesRef.current.set(callId, { shapeId: tableShapeId, columns, rowCount: 0, accumulatedRows: [] });
          // DataTable tracking initialized
        }

        return;
      }

      if (toolName === "_streaming_scalars") {
        const { callId, scalars } = args as { callId: string; scalars: Record<string, unknown> };

        // Update layout frame name
        const layoutState = streamingLayoutsRef.current.get(callId);
        if (layoutState) {
          if (scalars.frameName) {
            editor.updateShape({ id: layoutState.frameId, type: "frame", props: { name: scalars.frameName as string } });
          }
          if (scalars.columns) layoutState.columns = scalars.columns as number;
          if (scalars.type) {
            // Layout type updated via scalar
            layoutState.type = scalars.type as string;
            layoutState.isGrid = (scalars.type === "grid" || scalars.type === undefined);
          }
        }

        // Update document title
        const docState = streamingDocsRef.current.get(callId);
        if (docState && scalars.title) {
          editor.updateShape({ id: docState.shapeId, type: "document", props: { title: scalars.title as string } });
        }

        // Update table title and columns
        const tableState = streamingTablesRef.current.get(callId);
        if (tableState) {
          if (scalars.title) {
            editor.updateShape({ id: tableState.shapeId, type: "datatable", props: { title: scalars.title as string } });
          }
          if (scalars.columns && Array.isArray(scalars.columns)) {
            tableState.columns = scalars.columns as string[];
            const shape = editor.getShape(tableState.shapeId);
            if (shape) {
              editor.updateShape({
                id: tableState.shapeId,
                type: "datatable",
                meta: { ...(shape.meta as Record<string, unknown>), initialData: JSON.stringify({ columns: tableState.columns, rows: [] }) },
              });
            }
          }
        }
        return;
      }

      if (toolName === "_streaming_item") {
        const { callId, item, index } = args as {
          callId: string;
          item: Record<string, unknown>;
          index: number;
        };

        // Layout items (stickies/shapes in a frame)
        const layoutState = streamingLayoutsRef.current.get(callId);
        if (layoutState) {
          const { frameId, columns, isGrid, itemWidth, shapeHeight, gapX, gapY, padding, titleSpace } = layoutState;

          // For hierarchy/flow layouts, DON'T stream individual shapes — the grid
          // placement logic doesn't work for tree structures. Accumulate items and
          // let _streaming_done place them all at once with proper layout.
          if (!isGrid) {
            if (!layoutState.pendingItems) layoutState.pendingItems = [];
            layoutState.pendingItems.push(item);
            layoutState.itemCount = (layoutState.pendingItems?.length || 0);
            return;
          }

          const col = index % columns;
          const row = Math.floor(index / columns);

          // Estimate sticky height from text
          const text = (item.text as string) || "";
          const charsPerLine = 14;
          const lineHeight = 28;
          const verticalPadding = 80;
          const lines = Math.ceil(text.length / charsPerLine);
          const itemH = Math.max(200, lines * lineHeight + verticalPadding);

          const x = padding + col * (itemWidth + gapX);
          const y = titleSpace + padding + row * (Math.max(200, shapeHeight) + gapY);

          const itemId = createShapeId();
          editor.createShape({
            id: itemId,
            type: "note",
            x, y,
            rotation: noteRotation(),
            parentId: frameId,
            props: {
              richText: toRichText(text),
              color: randomStickyColor(),
              font: "sans",
              size: "s",
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(itemId);

          // Grow frame height if we've entered a new row
          layoutState.itemCount = index + 1;
          const totalRows = Math.floor(index / columns) + 1;
          const neededHeight = padding + titleSpace + totalRows * (Math.max(200, shapeHeight) + gapY) + padding;
          const frame = editor.getShape(frameId);
          if (frame) {
            const currentH = (frame.props as { h: number }).h;
            if (neededHeight > currentH) {
              editor.updateShape({
                id: frameId,
                type: "frame",
                props: { h: neededHeight },
              });
            }
          }
          return;
        }

        // DataTable rows
        const tableState = streamingTablesRef.current.get(callId);
        if (tableState) {
          // item is a string[] (row data) — accumulate in tracking state
          const row = item as unknown as string[];
          tableState.accumulatedRows.push(row);
          tableState.rowCount = tableState.accumulatedRows.length;
          const shape = editor.getShape(tableState.shapeId);
          if (shape) {
            const meta = (shape.meta || {}) as Record<string, unknown>;
            editor.updateShape({
              id: tableState.shapeId,
              type: "datatable",
              meta: {
                ...meta,
                pendingRows: JSON.stringify(tableState.accumulatedRows),
              },
            });

            // Grow table height as rows arrive
            const ROW_HEIGHT = 32;
            const CHROME_HEIGHT = 42 + 34 + 32; // title + header + add-row button
            const neededHeight = CHROME_HEIGHT + tableState.accumulatedRows.length * ROW_HEIGHT;
            const currentH = (shape.props as { h: number }).h;
            if (neededHeight > currentH) {
              editor.updateShape({
                id: tableState.shapeId,
                type: "datatable",
                props: { h: neededHeight },
              });
            }
          }
          return;
        }

        return;
      }

      if (toolName === "_streaming_content") {
        const { callId, content } = args as { callId: string; content: string };

        const docState = streamingDocsRef.current.get(callId);
        if (docState) {
          // Update the document shape's pendingContent — DocumentEditor watches this
          const shape = editor.getShape(docState.shapeId);
          if (shape) {
            editor.updateShape({
              id: docState.shapeId,
              type: "document",
              meta: {
                ...(shape.meta as Record<string, unknown>),
                pendingContent: content,
              },
            });
          }
        }
        return;
      }

      if (toolName === "_streaming_done") {
        const { callId, toolName: streamToolName, args: finalArgs } = args as {
          callId: string;
          toolName: string;
          args: Record<string, unknown>;
        };

        // Finalize createLayout
        const layoutState = streamingLayoutsRef.current.get(callId);
        if (layoutState) {
          const { frameId, columns, itemWidth, gapX, gapY, padding, titleSpace, isGrid, shapeHeight } = layoutState;
          const finalLayout = finalArgs as {
            items: Array<{ text?: string; color?: string; parentIndex?: number }>;
            frameName?: string;
          };

          if (!isGrid) {
            // HIERARCHY/FLOW: items weren't streamed individually — delete the
            // placeholder frame and dispatch through the normal createLayout handler
            // which has proper tree layout logic.
            editor.deleteShape(frameId);
            streamingLayoutsRef.current.delete(callId);
            // Fall through to normal createLayout by calling handleToolCall recursively
            handleToolCall("createLayout", finalArgs);
            return;
          }

          // GRID: Resize frame to exact fit
          const totalItems = finalLayout.items?.length || layoutState.itemCount;
          const totalRows = Math.ceil(totalItems / columns);
          const actualCols = Math.min(columns, totalItems);
          const frameWidth = padding * 2 + actualCols * itemWidth + (actualCols - 1) * gapX;
          const frameHeight = padding + titleSpace + totalRows * (Math.max(200, shapeHeight) + gapY) + padding;

          editor.updateShape({
            id: frameId,
            type: "frame",
            props: {
              name: finalLayout.frameName || (editor.getShape(frameId)?.props as { name: string }).name,
              w: frameWidth,
              h: frameHeight,
            },
          });

          streamingLayoutsRef.current.delete(callId);
          // Layout finalized
          return;
        }

        // Finalize createDocument
        const docState = streamingDocsRef.current.get(callId);
        if (docState) {
          const finalDoc = finalArgs as { content?: string; title?: string };
          const shape = editor.getShape(docState.shapeId);
          if (shape && finalDoc.content) {
            // Set final content via pendingContent — DocumentEditor applies it
            const meta = (shape.meta || {}) as Record<string, unknown>;
            editor.updateShape({
              id: docState.shapeId,
              type: "document",
              props: {
                ...(shape.props as Record<string, unknown>),
                title: finalDoc.title || (shape.props as { title: string }).title,
              },
              meta: {
                ...meta,
                pendingContent: finalDoc.content,
              },
            });
          }
          streamingDocsRef.current.delete(callId);

          // Add landmark stickers for exec summary / recommendation docs
          const docTitle = (finalDoc.title || "").toLowerCase();
          const docShape = editor.getShape(docState.shapeId);
          if (docShape) {
            const dx = (docShape as any).x as number;
            const dy = (docShape as any).y as number;
            const dw = ((docShape.props as any).w || 780) as number;

            if (docTitle.includes("exec") || docTitle.includes("summary") || docTitle.includes("overview")) {
              const stkAssetId = `asset:sticker-start-${Date.now()}` as any;
              editor.createAssets([{
                id: stkAssetId, type: "image", typeName: "asset",
                props: { name: "start-flag", src: "https://mirostatic.com/app/static/69de2b7d83d98e859295b4c4f7878b8b.svg", w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
                meta: {},
              }]);
              editor.createShape({
                id: createShapeId(), type: "image",
                x: dx - 180 - 20, y: dy + 10,
                props: { assetId: stkAssetId, w: 180, h: 180 },
                meta: { createdBy: "ai" },
              });
            } else if (docTitle.includes("recommend") || docTitle.includes("conclusion") || docTitle.includes("verdict")) {
              const stkAssetId = `asset:sticker-finish-${Date.now()}` as any;
              editor.createAssets([{
                id: stkAssetId, type: "image", typeName: "asset",
                props: { name: "checkered-flag", src: "https://mirostatic.com/stickers/asset-sync/blue-rondy__5/rondy-stickers-checkered-flag.svg", w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
                meta: {},
              }]);
              editor.createShape({
                id: createShapeId(), type: "image",
                x: dx + dw - 80, y: dy - 53,
                props: { assetId: stkAssetId, w: 160, h: 160 },
                meta: { createdBy: "ai" },
              });
            }
          }

          // Document finalized
          return;
        }

        // Finalize createDataTable
        const tableState = streamingTablesRef.current.get(callId);
        if (tableState) {
          const finalTable = finalArgs as { columns?: string[]; rows?: string[][]; title?: string };
          const shape = editor.getShape(tableState.shapeId);
          if (shape) {
            const meta = (shape.meta || {}) as Record<string, unknown>;
            const cols = finalTable.columns || tableState.columns;
            const rows = finalTable.rows || [];

            // Build clean meta without undefined values (tldraw rejects them)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const cleanMeta: any = { ...meta, initialData: JSON.stringify({ columns: cols, rows }) };
            delete cleanMeta.pendingRows;

            // Only update title and meta — keep the size the table grew to during streaming
            editor.updateShape({
              id: tableState.shapeId,
              type: "datatable",
              props: {
                title: finalTable.title || (shape.props as { title: string }).title,
              },
              meta: cleanMeta,
            });
          }
          streamingTablesRef.current.delete(callId);
          // DataTable finalized
          return;
        }

        // If no streaming state found, this was a non-streamed tool — fall through to normal handlers
        // (shouldn't happen, but safe fallback)
        return;
      }

      // ===== END STREAMING HANDLERS =====

      if (toolName === "createSticky") {
        const { text, color, parentFrameId } = args as {
          text: string;
          color: string;
          parentFrameId?: string;
        };

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "widget", width: 200, height: 200 });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "note",
              x: pos.x,
              y: pos.y,
              rotation: noteRotation(),
              parentId: parentFrameId as any,
              props: {
                richText: toRichText(text),
                color: randomStickyColor(),
                font: "sans",
                size: "s",
              },
              meta: { createdBy: "ai" },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "widget", width: 200, height: 200 }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "widget", width: 200, height: 200 });

          shapeId = createShapeId();
          editor.createShape({
            id: shapeId,
            type: "note",
            x: pos.x,
            y: pos.y,
            rotation: noteRotation(),
            props: {
              richText: toRichText(text),
              color: randomStickyColor(),
              font: "sans",
              size: "s",
            },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(shapeId, { category: "widget", width: 200, height: 200 }, pos);
        }
      }

      if (toolName === "createShape") {
        const { type, text, width, height, color, parentFrameId } = args as {
          type: string;
          text?: string;
          width: number;
          height: number;
          color: string;
          parentFrameId?: string;
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

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "widget", width: validWidth, height: validHeight });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "geo",
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                geo: geoMap[type] || "rectangle",
                w: validWidth,
                h: validHeight,
                color: colorMap[color] || "black",
                font: "sans",
                dash: "solid",
                fill: "solid",
                richText: text ? toRichText(text) : toRichText(""),
              },
              meta: { createdBy: "ai" },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "widget", width: validWidth, height: validHeight }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "widget", width: validWidth, height: validHeight });

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
              font: "sans",
              dash: "solid",
              fill: "solid",
              richText: text ? toRichText(text) : toRichText(""),
            },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(shapeId, { category: "widget", width: validWidth, height: validHeight }, pos);
        }
      }

      if (toolName === "createText") {
        const { text, parentFrameId } = args as {
          text: string;
          parentFrameId?: string;
        };

        // Estimate text size (roughly 10px per char width, 30px height)
        const estimatedWidth = Math.max(text.length * 10, 100);
        const estimatedHeight = 40;

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "widget", width: estimatedWidth, height: estimatedHeight });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "text",
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                richText: toRichText(text),
                size: "m",
              },
              meta: { createdBy: "ai" },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "widget", width: estimatedWidth, height: estimatedHeight }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "widget", width: estimatedWidth, height: estimatedHeight });

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
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(shapeId, { category: "widget", width: estimatedWidth, height: estimatedHeight }, pos);
        }
      }

      if (toolName === "createFrame") {
        const { name, width, height } = args as {
          name: string;
          width: number;
          height: number;
        };

        // Ensure valid dimensions (minimum 100px for frames)
        const validWidth = Math.max(width || 400, 100);
        const validHeight = Math.max(height || 300, 100);

        const engine = getPlacementEngine();
        const pos = engine.place({ category: "format", width: validWidth, height: validHeight });

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
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
      }

      if (toolName === "createDocument") {
        const { title, content, width, height, parentFrameId } = args as {
          title?: string;
          content?: string;
          width?: number;
          height?: number;
          parentFrameId?: string;
        };

        const validWidth = Math.max(width || 780, 200);
        // Estimate height from content so collision detection uses realistic size
        const estimatedH = content ? measureDocumentHeight(content, validWidth) : 660;
        const validHeight = Math.max(height || estimatedH, 200);

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "format", width: validWidth, height: validHeight });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "document",
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                docId: generateId(),
                title: title || "Untitled document",
                w: validWidth,
                h: validHeight,
              },
              meta: {
                createdBy: "ai",
                initialContent: content || undefined,
              },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "format", width: validWidth, height: validHeight });

          shapeId = createShapeId();
          editor.createShape({
            id: shapeId,
            type: "document",
            x: pos.x,
            y: pos.y,
            props: {
              docId: generateId(),
              title: title || "Untitled document",
              w: validWidth,
              h: validHeight,
            },
            meta: {
              createdBy: "ai",
              initialContent: content || undefined,
            },
          });
          engine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);

          // Add stickers to landmark documents
          const lowerTitle = (title || "").toLowerCase();
          if (lowerTitle.includes("exec") || lowerTitle.includes("summary") || lowerTitle.includes("overview")) {
            // START flag — top-left of exec summary
            const stkUrl = "https://mirostatic.com/app/static/69de2b7d83d98e859295b4c4f7878b8b.svg";
            const stkW = 180;
            const stkH = 180;
            const stkAssetId = `asset:sticker-start-${Date.now()}` as any;
            editor.createAssets([{
              id: stkAssetId,
              type: "image",
              typeName: "asset",
              props: { name: "start-flag", src: stkUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
              meta: {},
            }]);
            editor.createShape({
              id: createShapeId(),
              type: "image",
              x: pos.x - stkW - 20,
              y: pos.y + 10,
              props: { assetId: stkAssetId, w: stkW, h: stkH },
              meta: { createdBy: "ai" },
            });
          } else if (lowerTitle.includes("recommend") || lowerTitle.includes("conclusion") || lowerTitle.includes("verdict")) {
            // Checkered flag — top-right of recommendation
            const stkUrl = "https://mirostatic.com/stickers/asset-sync/blue-rondy__5/rondy-stickers-checkered-flag.svg";
            const stkW = 160;
            const stkH = 160;
            const stkAssetId = `asset:sticker-finish-${Date.now()}` as any;
            editor.createAssets([{
              id: stkAssetId,
              type: "image",
              typeName: "asset",
              props: { name: "checkered-flag", src: stkUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
              meta: {},
            }]);
            editor.createShape({
              id: createShapeId(),
              type: "image",
              x: pos.x + validWidth - stkW / 2,
              y: pos.y - stkH / 3,
              props: { assetId: stkAssetId, w: stkW, h: stkH },
              meta: { createdBy: "ai" },
            });
          }
        }
      }

      if (toolName === "updateDocument") {
        const { itemId, content } = args as { itemId: string; content: string };
        const shape = editor.getShape(itemId as TLShapeId);
        if (shape && shape.type === "document") {
          editor.updateShape({
            id: shape.id,
            type: "document",
            meta: { ...shape.meta, pendingContent: content },
          });

          // After doc resizes, reposition any confidence stickies that overlap it
          // Delay to let DocumentEditor re-render and update the shape height
          setTimeout(() => {
            const freshDoc = editor.getShape(shape.id);
            if (!freshDoc || !freshDoc.parentId) return;
            const docH = (freshDoc.props as any).h || 400;
            const docW = (freshDoc.props as any).w || 500;
            const CONF_OVERLAP = 60;
            const stickyW = 200;

            // Find confidence stickies in the same frame
            const siblings = editor.getCurrentPageShapes().filter(s => s.parentId === freshDoc.parentId);
            const confStickies = siblings.filter(s => {
              if (s.type !== "note") return false;
              const text = ((s.props as any).richText?.content?.[0]?.content?.[0]?.text || "").toLowerCase();
              return text.includes("confidence");
            });

            let maxChildBottom = 0;
            for (const sticky of confStickies) {
              // Check if this sticky belongs to this doc (by X proximity)
              const stickyCenterX = sticky.x + stickyW / 2;
              const docCenterX = freshDoc.x + docW / 2;
              if (Math.abs(stickyCenterX - docCenterX) < docW) {
                const newX = freshDoc.x + Math.floor((docW - stickyW) / 2);
                const newY = freshDoc.y + docH - CONF_OVERLAP;
                editor.updateShape({
                  id: sticky.id,
                  type: "note",
                  x: newX,
                  y: newY,
                });
                maxChildBottom = Math.max(maxChildBottom, newY + stickyW);

                // Also reposition RECOMMENDED sticker if this is a green sticky
                const stickyColor = (sticky.props as any).color;
                if (stickyColor === "green") {
                  const allShapes = editor.getCurrentPageShapes();
                  const images = allShapes.filter(s => s.type === "image");
                  const recSticker = images.find(img => {
                    const assetId = (img.props as any).assetId || "";
                    return assetId.includes("sticker-recommended");
                  });
                  if (recSticker) {
                    const frame = editor.getShape(freshDoc.parentId as any);
                    const frameX = frame?.x || 0;
                    const frameY = frame?.y || 0;
                    const dW = (recSticker.props as any).w || 140;
                    editor.updateShape({
                      id: recSticker.id,
                      type: "image",
                      x: frameX + newX + stickyW - dW + 20,
                      y: frameY + newY + stickyW - 50,
                    });
                    maxChildBottom = Math.max(maxChildBottom, newY + stickyW);
                  }
                }
              }
            }

            // Resize parent frame if stickies extend beyond its bounds
            if (maxChildBottom > 0 && freshDoc.parentId) {
              const frame = editor.getShape(freshDoc.parentId as any);
              if (frame) {
                const frameH = (frame.props as any).h || 600;
                const neededH = maxChildBottom + 40; // 40px padding
                if (neededH > frameH) {
                  editor.updateShape({
                    id: frame.id,
                    type: "frame",
                    props: { h: neededH },
                  });
                }
              }
            }
          }, 500);
        }
      }

      if (toolName === "updateTaskCard") {
        const { itemId, ...updates } = args as { itemId: string; title?: string; description?: string; status?: string; priority?: string; assignee?: string; dueDate?: string; tags?: string[]; subtasks?: Array<{ id: string; title: string; completed: boolean }> };
        const shape = editor.getShape(itemId as TLShapeId);
        if (shape && (shape.type as string) === "taskcard") {
          const currentProps = shape.props as Record<string, unknown>;
          editor.updateShape({
            id: shape.id,
            type: "taskcard" as any,
            props: {
              ...currentProps,
              ...(updates.title !== undefined && { title: updates.title }),
              ...(updates.description !== undefined && { description: updates.description }),
              ...(updates.status !== undefined && { status: updates.status }),
              ...(updates.priority !== undefined && { priority: updates.priority }),
              ...(updates.assignee !== undefined && { assignee: updates.assignee }),
              ...(updates.dueDate !== undefined && { dueDate: updates.dueDate }),
              ...(updates.tags !== undefined && { tags: updates.tags }),
              ...(updates.subtasks !== undefined && { subtasks: updates.subtasks }),
            },
          });
        }
      }

      if (toolName === "createDataTable") {
        const { title, columns, rows, width, height, parentFrameId } = args as {
          title?: string;
          columns?: string[];
          rows?: string[][];
          width?: number;
          height?: number;
          parentFrameId?: string;
        };

        // Calculate size from content if not explicitly provided
        let calcWidth = width;
        let calcHeight = height;

        if (!calcWidth && columns && rows) {
          // Estimate each column width from header + longest cell content
          const COL_MIN = 90;
          const COL_MAX = 220;
          const CHAR_WIDTH = 7.5; // approx px per char at 12px font
          const COL_PADDING = 24; // cell padding
          const ROW_NUM_COL = 36;
          const ADD_COL_BTN = 32;

          let totalColWidth = ROW_NUM_COL + ADD_COL_BTN;
          columns.forEach((header, colIdx) => {
            // Find the longest text in this column (header + all cells)
            let maxLen = header.length;
            rows.forEach((row) => {
              if (row[colIdx]) maxLen = Math.max(maxLen, row[colIdx].length);
            });
            const colWidth = Math.min(Math.max(maxLen * CHAR_WIDTH + COL_PADDING, COL_MIN), COL_MAX);
            totalColWidth += colWidth;
          });
          calcWidth = totalColWidth;
        }

        if (!calcHeight && rows) {
          const TITLE_BAR = 42;
          const HEADER_ROW = 34;
          const ROW_HEIGHT = 32;
          const ADD_ROW_BTN = 32;
          calcHeight = TITLE_BAR + HEADER_ROW + rows.length * ROW_HEIGHT + ADD_ROW_BTN;
        }

        const validWidth = Math.max(calcWidth || 700, 200);
        const validHeight = Math.max(calcHeight || 460, 150);

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "format", width: validWidth, height: validHeight });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "datatable",
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                tableId: generateId(),
                title: title || "Untitled table",
                w: validWidth,
                h: validHeight,
              },
              meta: {
                createdBy: "ai",
                initialData: (columns && rows) ? JSON.stringify({ columns, rows }) : undefined,
              },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "format", width: validWidth, height: validHeight });

          shapeId = createShapeId();
          editor.createShape({
            id: shapeId,
            type: "datatable",
            x: pos.x,
            y: pos.y,
            props: {
              tableId: generateId(),
              title: title || "Untitled table",
              w: validWidth,
              h: validHeight,
            },
            meta: {
              createdBy: "ai",
              initialData: (columns && rows) ? JSON.stringify({ columns, rows }) : undefined,
            },
          });
          engine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
        }
      }

      if (toolName === "createSticker_result") {
        const { url, width, height, stickerId, error, parentFrameId } = args as {
          url: string;
          width: number;
          height: number;
          stickerId: string;
          error?: string;
          parentFrameId?: string;
        };

        if (error || !url) {
          // No matching sticker found — skip
        } else {

        const displayW = 120;
        const displayH = (height / width) * displayW;
        const assetId = `asset:sticker-${stickerId}-${Date.now()}` as any;
        editor.createAssets([{
          id: assetId,
          type: "image",
          typeName: "asset",
          props: {
            name: stickerId,
            src: url,
            w: width,
            h: height,
            mimeType: "image/png",
            isAnimated: false,
          },
          meta: {},
        }]);

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "decorative", width: displayW, height: displayH });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "image",
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                assetId,
                w: displayW,
                h: displayH,
              },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "decorative", width: displayW, height: displayH }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "decorative", width: displayW, height: displayH });
          shapeId = createShapeId();
          editor.createShape({
            id: shapeId,
            type: "image",
            x: pos.x,
            y: pos.y,
            props: {
              assetId,
              w: displayW,
              h: displayH,
            },
          });
          engine.recordPlacement(shapeId, { category: "decorative", width: displayW, height: displayH }, pos);
        }
        }
      }

      if (toolName === "createTaskCard") {
        const { title, description, status, priority, assignee, dueDate, tags, subtasks, parentFrameId } = args as {
          title?: string;
          description?: string;
          status?: string;
          priority?: string;
          assignee?: string;
          dueDate?: string;
          tags?: string[];
          subtasks?: Array<{ id: string; title: string; completed: boolean }>;
          parentFrameId?: string;
        };

        const validWidth = 288;
        const validHeight = 160;

        if (parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(parentFrameId);
          if (zoneEngine) {
            const pos = zoneEngine.place({ category: "widget", width: validWidth, height: validHeight });
            shapeId = createShapeId();
            editor.createShape({
              id: shapeId,
              type: "taskcard" as any,
              x: pos.x,
              y: pos.y,
              parentId: parentFrameId as any,
              props: {
                w: validWidth,
                h: validHeight,
                title: title || "Untitled task",
                description: description || "",
                status: status || "not_started",
                priority: priority || "medium",
                assignee: assignee || "",
                dueDate: dueDate || "",
                tags: tags || [],
                subtasks: subtasks || [],
              },
              meta: { createdBy: "ai" },
            });
            const newH = zoneEngine.recordPlacement(shapeId, { category: "widget", width: validWidth, height: validHeight }, pos);
            maybeResizeParentFrame(parentFrameId, newH);
          }
        } else {
          const engine = getPlacementEngine();
          const pos = engine.place({ category: "widget", width: validWidth, height: validHeight });

          shapeId = createShapeId();
          editor.createShape({
            id: shapeId,
            type: "taskcard" as any,
            x: pos.x,
            y: pos.y,
            props: {
              w: validWidth,
              h: validHeight,
              title: title || "Untitled task",
              description: description || "",
              status: status || "not_started",
              priority: priority || "medium",
              assignee: assignee || "",
              dueDate: dueDate || "",
              tags: tags || [],
              subtasks: subtasks || [],
            },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(shapeId, { category: "widget", width: validWidth, height: validHeight }, pos);
        }
      }

      if (toolName === "createGanttChart") {
        const { title, tasks, links, colorScheme: ganttColorScheme } = args as {
          title?: string;
          tasks?: Array<{ id: number; text: string; start: string; end: string; progress: number; parent: number; type: string; open: boolean }>;
          links?: Array<{ id: number; source: number; target: number; type: string }>;
          colorScheme?: string;
        };

        // Generous initial size — AutoSizeWrapper will adjust to fit content
        const validWidth = 1200;
        const validHeight = 500;
        const engine = getPlacementEngine();
        const pos = engine.place({ category: "format", width: validWidth, height: validHeight });

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "ganttchart" as any,
          x: pos.x,
          y: pos.y,
          props: {
            w: validWidth,
            h: validHeight,
            title: title || "Project Timeline",
            tasks: tasks || [],
            links: links || [],
            scales: [
              { unit: "month", step: 1, format: "%F %Y" },
              { unit: "week", step: 1, format: "%j" },
            ],
            columns: [
              { id: "text", header: "Task name", width: 210 },
              { id: "start", header: "Start date", width: 106, align: "center" },
              { id: "add-task", header: "", width: 40, align: "center" },
            ],
            colorScheme: ganttColorScheme || "",
          },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
      }

      if (toolName === "createKanbanBoard") {
        const { title, lanes: lanesArg, cards: cardsArg } = args as {
          title?: string;
          lanes?: Array<{ title: string; color?: string }>;
          cards?: Array<{ title: string; lane: string; status?: string; priority?: string; assignee?: string; tags?: string[] }>;
        };

        // Generous initial size — AutoSizeWrapper will adjust to fit content
        const laneCount = lanesArg?.length || 3;
        const validWidth = Math.max(laneCount * 296 + 328, 900);
        const validHeight = 500;
        const engine = getPlacementEngine();
        const pos = engine.place({ category: "format", width: validWidth, height: validHeight });

        // Build lanes
        const defaultLanes = [
          { id: "lane-todo", title: "To Do", color: "#3B82F6", statusMapping: "To Do" },
          { id: "lane-doing", title: "Doing", color: "#F59E0B", statusMapping: "In Progress" },
          { id: "lane-done", title: "Done", color: "#10B981", statusMapping: "Done" },
        ];
        const lanes = lanesArg?.length ? lanesArg.map((l, i) => ({
          id: `lane-${i}-${Date.now()}`,
          title: l.title,
          color: l.color || ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6", "#EF4444"][i % 5],
          statusMapping: l.title,
        })) : defaultLanes;

        // Build cards and cardsByLane
        const builtCards: any[] = [];
        const cardsByLane: Record<string, string[]> = {};
        lanes.forEach(l => { cardsByLane[l.id] = []; });

        if (cardsArg) {
          cardsArg.forEach((c, i) => {
            const cardId = `kb-card-${Date.now()}-${i}`;
            const targetLane = lanes.find(l => l.title.toLowerCase() === c.lane.toLowerCase()) || lanes[0];
            builtCards.push({
              id: cardId,
              title: c.title,
              description: "",
              status: c.status || "not_started",
              priority: c.priority || "medium",
              assignee: c.assignee || "",
              dueDate: "",
              tags: c.tags || [],
              subtasks: [],
            });
            cardsByLane[targetLane.id].push(cardId);
          });
        }

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "kanbanboard" as any,
          x: pos.x,
          y: pos.y,
          props: {
            w: validWidth,
            h: validHeight,
            title: title || "Kanban Board",
            lanes,
            cards: builtCards,
            cardsByLane,
          },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(shapeId, { category: "format", width: validWidth, height: validHeight }, pos);
      }

      // ─── createZone_result: composed frame with mixed content ────────────
      // Chat flow: server processes createZone → sends createZone_result
      // Voice flow: useRealtimeVoice renames createZone → createZone_result before dispatch
      if (toolName === "createZone_result") {
        const {
          title, layout, gantt, summary, people,
          isRecommended, confidence, headerColor, userInsight, evaluation, solutions, resolvedStickers,
        } = args as {
          title?: string;
          layout?: "project" | "synthesis" | "solution";
          gantt?: {
            title: string;
            tasks: Array<{ id: number; text: string; start: string; end: string; duration: number; progress: number; parent: number; type: string; open: boolean; color?: string }>;
            links: Array<{ id: number; source: number; target: number; type: string }>;
          } | null;
          summary?: { title: string; content: string } | null;
          people?: Array<{ name: string; role: string }> | null;
          isRecommended?: boolean;
          confidence?: string | null;
          headerColor?: string | null;
          userInsight?: {
            feedback: Array<{ title: string; description: string; status?: string; assignee?: string; tags?: string[] }>;
            metrics: Array<{ text: string; color: string }>;
            requests: Array<{ text: string; color: string }>;
          } | null;
          evaluation?: {
            opportunity: Array<{ text: string; color: string }>;
            risks: Array<{ text: string; color: string }>;
            potential: Array<{ text: string; color: string }>;
          } | null;
          solutions?: Array<{
            title: string;
            summary: { title: string; content: string };
            confidence: string;
            isRecommended: boolean;
          }> | null;
          resolvedStickers?: Array<{ url: string; width: number; height: number; stickerId: string }>;
        };

        // ── Layout constants ──
        const pad = 36;           // increased from 24 for airier feel
        const gap = 56;           // increased from 40 for more spacing between sections
        const sectionLabelH = 28;

        // Track items for delayed reposition
        type ZoneItem = {
          id: ReturnType<typeof createShapeId>;
          kind: "format" | "cards" | "label" | "stickyRow" | "stickyGrid" | "threeCol";
          cardIds?: ReturnType<typeof createShapeId>[];
          cardW?: number; cardGapH?: number; cardH?: number;
          stickyIds?: ReturnType<typeof createShapeId>[];
          stickyW?: number; stickyH?: number; stickyCols?: number;
          colData?: Array<{ labelId: ReturnType<typeof createShapeId>; itemIds: ReturnType<typeof createShapeId>[]; colWidth: number }>;
          xOffset?: number;
        };
        const zoneItems: ZoneItem[] = [];

        // ════════════════════════════════════════════════════════
        // SYNTHESIS LAYOUT — narrow frame, doc only (synchronous)
        // ════════════════════════════════════════════════════════
        if (layout === "synthesis") {
          const FW = 750;
          const PAD = 72;
          const TITLE_H = 160;
          const contentWidth = FW - PAD * 2;

          // Pre-calculate total height
          const docH = summary ? measureDocumentHeight(summary.content, contentWidth, 300) : 0;
          const totalH = PAD + TITLE_H + docH + PAD;
          const frameHeight = Math.max(totalH, 300);

          // Create frame at full calculated size
          const engine = getPlacementEngine();
          const framePos = engine.place({ category: "format", width: FW, height: frameHeight });
          const frameId = createShapeId();
          editor.createShape({
            id: frameId, type: "frame",
            x: framePos.x, y: framePos.y,
            props: { name: "", w: FW, h: frameHeight },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(frameId as unknown as string, { category: "format", width: FW, height: frameHeight }, framePos);

          let cy = PAD;

          // Title text
          editor.createShape({
            id: createShapeId(), type: "text",
            x: PAD, y: cy, parentId: frameId,
            props: { richText: toRichText(title || "Synthesis"), size: "xl", font: "sans", color: "black" },
            meta: { createdBy: "ai" },
          });
          cy += TITLE_H;

          // Summary document
          if (summary) {
            editor.createShape({
              id: createShapeId(), type: "document",
              x: PAD, y: cy, parentId: frameId,
              props: { docId: generateId(), title: summary.title, w: contentWidth, h: docH },
              meta: { createdBy: "ai", initialContent: summary.content },
            });
          }

          shapeId = frameId;

        // ════════════════════════════════════════════════════════
        // SOLUTION LAYOUT — shared frame with 2 side-by-side cards
        // ════════════════════════════════════════════════════════
        } else if (layout === "solution") {
          const FW = 1200;
          const PAD = 72;
          const CARD_GAP = 48;
          const CARD_W = Math.floor((FW - PAD * 2 - CARD_GAP) / 2); // ~504px each
          const TITLE_H = 160;
          const CONF_STICKY = 200;       // "s" note size
          const CONF_OVERLAP = 60;       // how far the sticky overlaps the doc bottom

          const solArr = (solutions || []).filter(sol => sol && sol.summary);

          // Pre-calculate card heights from data
          // Doc gets an h1 with the solution title prepended, so measure with that
          const cardHeights = solArr.map(sol => {
            const docContent = `<h1>${sol.title || ""}</h1>${sol.summary?.content || ""}`;
            const docH = measureDocumentHeight(docContent, CARD_W, 150);
            // Sticky overlaps the doc by CONF_OVERLAP, so net addition is less
            return docH + (CONF_STICKY - CONF_OVERLAP) + 24;
          });
          const maxCardH = cardHeights.length > 0 ? Math.max(...cardHeights) : 400;
          const totalH = PAD + TITLE_H + maxCardH + PAD;

          // Create frame at full calculated size
          const engine = getPlacementEngine();
          const framePos = engine.place({ category: "format", width: FW, height: totalH });
          const frameId = createShapeId();
          editor.createShape({
            id: frameId, type: "frame",
            x: framePos.x, y: framePos.y,
            props: { name: "", w: FW, h: totalH },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(frameId as unknown as string, { category: "format", width: FW, height: totalH }, framePos);

          // Frame title
          editor.createShape({
            id: createShapeId(), type: "text",
            x: PAD, y: PAD, parentId: frameId,
            props: { richText: toRichText(title || "Possible Solutions"), size: "xl", font: "sans", color: "black" },
            meta: { createdBy: "ai" },
          });

          // Place each solution card side-by-side
          let recStickyX = 0;
          let recStickyY = 0;
          for (let i = 0; i < solArr.length; i++) {
            const sol = solArr[i];
            const cardX = PAD + i * (CARD_W + CARD_GAP);
            let cy = PAD + TITLE_H;

            // Document card — solution title as h1 inside the doc itself
            const docContent = `<h1>${sol.title || ""}</h1>${sol.summary?.content || ""}`;
            const docH = measureDocumentHeight(docContent, CARD_W, 150);
            editor.createShape({
              id: createShapeId(), type: "document",
              x: cardX, y: cy, parentId: frameId,
              props: { docId: generateId(), title: sol.summary?.title || sol.title || "", w: CARD_W, h: docH },
              meta: { createdBy: "ai", initialContent: docContent },
            });

            // Confidence sticky — overlaps bottom of doc, centered horizontally on the card
            const confText = `${sol.confidence || "?"} confidence`;
            const confX = cardX + Math.floor((CARD_W - CONF_STICKY) / 2); // center on card
            const confY = cy + docH - CONF_OVERLAP; // overlap bottom of doc
            const confId = createShapeId();
            editor.createShape({
              id: confId, type: "note",
              x: confX, y: confY, rotation: noteRotation(), parentId: frameId,
              props: {
                richText: toRichText(confText),
                color: sol.isRecommended ? (colorMap["green"] || "green") : (colorMap["yellow"] || "yellow"),
                font: "sans", size: "s", fontSizeAdjustment: 14,
              } as any,
              meta: { createdBy: "ai" },
            });

            if (sol.isRecommended) {
              recStickyX = confX;
              recStickyY = confY;
            }
          }

          // Recommended sticker — on the green confidence sticky, bottom-right
          const recSol = solArr.find(s => s.isRecommended);
          if (recSol) {
            const stickerUrl = "https://mirostatic.com/stickers/general-task-tacklers__2/task_tacklers_recommended.svg";
            const dW = 140, dH = 140;
            const assetId = `asset:sticker-recommended-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` as any;
            editor.createAssets([{
              id: assetId, type: "image", typeName: "asset",
              props: { name: "recommended", src: stickerUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
              meta: {},
            }]);
            editor.createShape({
              id: createShapeId(), type: "image",
              x: framePos.x + recStickyX + CONF_STICKY - dW + 20,
              y: framePos.y + recStickyY + CONF_STICKY - 50,
              props: { assetId, w: dW, h: dH },
              meta: { createdBy: "ai" },
            });
          }

          shapeId = frameId;

        // ════════════════════════════════════════════════════════
        // PROJECT LAYOUT — fully synchronous, no delays, no polling
        // ════════════════════════════════════════════════════════
        } else {
          // ── Layout constants ──
          const FW = 1500;
          const PAD = 72;                       // generous frame inner padding
          const STICKY_H = 200;                // tldraw "s" note height
          const HGAP = 24;                     // gap: header sticky → content
          const SGAP = 72;                     // gap between sections
          const CARD_GAP = 14;
          const METRIC_GAP = 16;
          const METRIC_W = 200;                // matches "s" note width
          const TITLE_H = 160;                 // zone title text height + big gap below
          const CX = PAD + 200 + HGAP;        // content start X
          const CW = FW - CX - PAD;           // content width

          const DOC_W = 550;                   // summary doc width
          const RGX = CX + DOC_W + 40;        // right group sticky X
          const RCX = RGX + 200 + HGAP;       // right content X
          const RCW = FW - RCX - PAD;         // right content width

          // ── Derive section header colors ──
          // Prio 1 (headerColor:"green") → ocean stickies, ocean-light metrics
          // Prio 2 (headerColor:"violet") → sunshine stickies, sunshine-light metrics
          const sectionColorMap: Record<string, string> = { green: "blue", violet: "yellow" };
          const sectionColor: string = sectionColorMap[headerColor || ""] || headerColor || "light-violet";
          const lightVariantMap: Record<string, string> = { blue: "light-blue", yellow: "orange", green: "light-green", violet: "light-violet", red: "light-red" };
          const sectionColorLight: string = lightVariantMap[sectionColor] || sectionColor;

          // ── Pre-calculate ALL section heights from data ──
          const docH = summary ? measureDocumentHeight(summary.content, DOC_W, 250) : 0;
          const peopleH = (people && people.length > 0) ? people.length * 48 + 40 : 0;
          const sec1H = Math.max(STICKY_H, docH, peopleH); // side-by-side row height

          const ganttH = gantt ? Math.max(350, 120 + (gantt.tasks?.length || 0) * 40) : 0;
          const sec2H = gantt ? Math.max(STICKY_H, ganttH) : 0;

          const feedbackSlice = (userInsight?.feedback || []).slice(0, 6);
          const cardW = Math.floor((CW - CARD_GAP * 2) / 3);
          const cardH = 140;
          const cardGridRows = feedbackSlice.length > 0 ? Math.ceil(feedbackSlice.length / 3) : 0;
          const sec3H = cardGridRows > 0 ? Math.max(STICKY_H, cardGridRows * (cardH + CARD_GAP)) : 0;

          const metricsSlice = (userInsight?.metrics || []).slice(0, 4);
          const sec4H = metricsSlice.length > 0 ? STICKY_H : 0;

          // ── Calculate total frame height ──
          let totalH = PAD + TITLE_H;
          if (sec1H > 0) totalH += sec1H + SGAP;
          if (sec2H > 0) totalH += sec2H + SGAP;
          if (sec3H > 0) totalH += sec3H + SGAP;
          if (sec4H > 0) totalH += sec4H + SGAP;
          totalH += PAD;

          // ── Create frame at full calculated size ──
          const engine = getPlacementEngine();
          const framePos = engine.place({ category: "format", width: FW, height: totalH });
          const frameId = createShapeId();
          editor.createShape({
            id: frameId, type: "frame",
            x: framePos.x, y: framePos.y,
            props: { name: title || "Zone", w: FW, h: totalH },
            meta: { createdBy: "ai" },
          });
          engine.recordPlacement(frameId as unknown as string, { category: "format", width: FW, height: totalH }, framePos);

          // ── Helpers ──
          const addHeaderSticky = (text: string, x: number, y: number) => {
            const sId = createShapeId();
            editor.createShape({
              id: sId, type: "note", x, y, rotation: noteRotation(), parentId: frameId,
              props: { richText: toRichText(text), color: sectionColor as any, font: "sans", size: "s", fontSizeAdjustment: 20 } as any,
              meta: { createdBy: "ai" },
            });
            return sId;
          };

          const addSticky = (text: string, color: string, x: number, y: number) => {
            const sId = createShapeId();
            editor.createShape({
              id: sId, type: "note", x, y, rotation: noteRotation(), parentId: frameId,
              props: { richText: toRichText(text), color: colorMap[color] || "yellow", font: "sans", size: "s", fontSizeAdjustment: 14 } as any,
              meta: { createdBy: "ai" },
            });
            return sId;
          };

          // ── Place everything synchronously ──
          let cy = PAD;

          // Zone title text
          editor.createShape({
            id: createShapeId(), type: "text",
            x: PAD, y: cy, parentId: frameId,
            props: { richText: toRichText(title || "Zone"), size: "xl", font: "sans", color: "black" },
            meta: { createdBy: "ai" },
          });
          cy += TITLE_H;

          // Section 1: Summary + People (side by side)
          if (summary || (people && people.length > 0)) {
            if (summary) {
              addHeaderSticky("Project\nSummary", PAD, cy);
              const docId = createShapeId();
              editor.createShape({
                id: docId, type: "document",
                x: CX, y: cy, parentId: frameId,
                props: { docId: generateId(), title: summary.title, w: DOC_W, h: docH },
                meta: { createdBy: "ai", initialContent: summary.content },
              });
            }
            if (people && people.length > 0) {
              addHeaderSticky("Key\nPeople", RGX, cy);
              editor.createShape({
                id: createShapeId(), type: "peoplelist" as any,
                x: RCX, y: cy, parentId: frameId,
                props: { w: RCW, h: peopleH, people, colorScheme: headerColor || "" },
                meta: { createdBy: "ai" },
              });
            }
            cy += sec1H + SGAP;
          }

          // Section 2: Timeline
          if (gantt) {
            addHeaderSticky("Project\nTimeline", PAD, cy);
            editor.createShape({
              id: createShapeId(), type: "ganttchart" as any,
              x: CX, y: cy, parentId: frameId,
              props: {
                w: CW, h: ganttH, title: gantt.title,
                tasks: gantt.tasks || [], links: gantt.links || [],
                scales: [{ unit: "month", step: 1, format: "%F %Y" }, { unit: "week", step: 1, format: "%j" }],
                columns: [{ id: "text", header: "Task name", width: 180 }, { id: "start", header: "Start", width: 90, align: "center" }, { id: "add-task", header: "", width: 40, align: "center" }],
                colorScheme: headerColor || "",
              },
              meta: { createdBy: "ai" },
            });
            cy += sec2H + SGAP;
          }

          // Section 3: User Insight cards
          if (feedbackSlice.length > 0) {
            addHeaderSticky("User\nInsights", PAD, cy);
            for (let i = 0; i < feedbackSlice.length; i++) {
              const fb = feedbackSlice[i];
              editor.createShape({
                id: createShapeId(), type: "taskcard" as any,
                x: CX + (i % 3) * (cardW + CARD_GAP),
                y: cy + Math.floor(i / 3) * (cardH + CARD_GAP),
                parentId: frameId,
                props: {
                  w: cardW, h: cardH, title: fb.title,
                  description: fb.description || "",
                  status: fb.status || "in_progress", priority: "medium",
                  assignee: fb.assignee || "", dueDate: "",
                  tags: fb.tags || [], subtasks: [],
                },
                meta: { createdBy: "ai" },
              });
            }
            cy += sec3H + SGAP;
          }

          // Section 4: Key Metrics — header uses section color, content uses light variant
          if (metricsSlice.length > 0) {
            addHeaderSticky("Key\nMetrics", PAD, cy);
            for (let i = 0; i < metricsSlice.length; i++) {
              addSticky(metricsSlice[i].text, sectionColorLight, CX + i * (METRIC_W + METRIC_GAP), cy);
            }
            cy += sec4H + SGAP;
          }

          // Recommended sticker (outside frame, top-right corner)
          if (isRecommended) {
            const stickerUrl = "https://mirostatic.com/stickers/general-task-tacklers__2/task_tacklers_recommended.svg";
            const dW = 180, dH = 180;
            const assetId = `asset:sticker-recommended-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` as any;
            editor.createAssets([{ id: assetId, type: "image", typeName: "asset", props: { name: "recommended", src: stickerUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false }, meta: {} }]);
            editor.createShape({ id: createShapeId(), type: "image", x: framePos.x + FW - dW + 10, y: framePos.y + 40, props: { assetId, w: dW, h: dH }, meta: { createdBy: "ai" } });
          } else if (resolvedStickers && resolvedStickers.length > 0) {
            const stk = resolvedStickers[0];
            const dW = 180, dH = 180;
            const assetId = `asset:sticker-${stk.stickerId}-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` as any;
            editor.createAssets([{ id: assetId, type: "image", typeName: "asset", props: { name: stk.stickerId, src: stk.url, w: stk.width, h: stk.height, mimeType: stk.url.endsWith(".svg") ? "image/svg+xml" : "image/png", isAnimated: false }, meta: {} }]);
            editor.createShape({ id: createShapeId(), type: "image", x: framePos.x + FW - dW + 10, y: framePos.y + 40, props: { assetId, w: dW, h: dH }, meta: { createdBy: "ai" } });
          }

          shapeId = frameId;
        }
      }

      // ─── createWorkshopBoard: decision workshop for team dot-voting ────────────
      // ─── addSolutionCard: append a new solution to the existing Possible Solutions frame ───
      if (toolName === "addSolutionCard") {
        const { title: solTitle, content, confidence, isRecommended: solRecommended } = args as {
          title?: string;
          content?: string;
          confidence?: string;
          isRecommended?: boolean;
        };

        // Find the solutions frame — look for frames with "solution" or "possible" in name, or containing document children
        const allShapes = editor.getCurrentPageShapes();
        const solutionsFrame = allShapes.find(s => {
          if (s.type !== "frame") return false;
          const name = ((s.props as any).name || "").toLowerCase();
          return name.includes("solution") || name.includes("possible");
        }) || allShapes.find(s => {
          // Fallback: find a frame that contains document shapes (likely the solutions frame)
          if (s.type !== "frame") return false;
          const children = allShapes.filter(c => c.parentId === s.id && c.type === "document");
          return children.length >= 2;
        });

        if (solutionsFrame) {
          const frameId = solutionsFrame.id;
          const frameW = (solutionsFrame.props as any).w || 1200;
          const frameH = (solutionsFrame.props as any).h || 600;

          // Count existing document cards to know the column index
          const existingDocs = allShapes.filter(s => s.parentId === frameId && s.type === "document");
          const colIndex = existingDocs.length; // 0-based, so 2 existing = column index 2

          // Layout constants (must match solution layout)
          const PAD = 72;
          const CARD_GAP = 48;
          const TITLE_H = 160;
          const CONF_STICKY = 200;
          const CONF_OVERLAP = 60;

          // Calculate card width from existing layout (reverse-engineer from frame width and doc count)
          const existingCount = Math.max(existingDocs.length, 2);
          const CARD_W = Math.floor((frameW - PAD * 2 - (existingCount - 1) * CARD_GAP) / existingCount);

          // New card position
          const cardX = PAD + colIndex * (CARD_W + CARD_GAP);
          const cy = PAD + TITLE_H;

          // Widen the frame to fit the new card
          const newFrameW = PAD * 2 + (colIndex + 1) * CARD_W + colIndex * CARD_GAP;
          editor.updateShape({
            id: frameId, type: "frame",
            props: { w: newFrameW },
          });

          // Document card
          const docContent = `<h1>${solTitle || "Option C"}</h1>${content || ""}`;
          const docH = measureDocumentHeight(docContent, CARD_W, 150);
          editor.createShape({
            id: createShapeId(), type: "document",
            x: cardX, y: cy, parentId: frameId,
            props: { docId: generateId(), title: solTitle || "Option C", w: CARD_W, h: docH },
            meta: { createdBy: "ai", initialContent: docContent },
          });

          // Confidence sticky
          let newConfX = 0;
          let newConfY = 0;
          if (confidence) {
            const confText = `${confidence} confidence`;
            newConfX = cardX + Math.floor((CARD_W - CONF_STICKY) / 2);
            newConfY = cy + docH - CONF_OVERLAP;
            editor.createShape({
              id: createShapeId(), type: "note",
              x: newConfX, y: newConfY, rotation: noteRotation(), parentId: frameId,
              props: {
                richText: toRichText(confText),
                color: solRecommended ? (colorMap["green"] || "green") : (colorMap["yellow"] || "yellow"),
                font: "sans", size: "s", fontSizeAdjustment: 14,
              } as any,
              meta: { createdBy: "ai" },
            });
          }

          // If this is the new recommended solution, move the RECOMMENDED sticker
          if (solRecommended) {
            // Find and remove old recommended sticker image(s) inside the solutions frame
            const frameChildren = allShapes.filter(s => s.parentId === frameId);
            frameChildren.forEach(child => {
              if (child.type === "image") {
                const assetId = (child.props as any).assetId as string | undefined;
                if (assetId && assetId.includes("recommended")) {
                  editor.deleteShape(child.id);
                }
              }
            });

            // Also change old green confidence stickies to yellow (de-recommend)
            frameChildren.forEach(child => {
              if (child.type === "note") {
                const noteColor = (child.props as any).color;
                if (noteColor === (colorMap["green"] || "green")) {
                  editor.updateShape({
                    id: child.id, type: "note",
                    props: { color: colorMap["yellow"] || "yellow" },
                  });
                }
              }
            });

            // Place RECOMMENDED sticker on the new card's confidence sticky
            if (confidence) {
              const stickerUrl = "https://mirostatic.com/stickers/general-task-tacklers__2/task_tacklers_recommended.svg";
              const dW = 140, dH = 140;
              const assetId = `asset:sticker-recommended-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` as any;
              editor.createAssets([{
                id: assetId, type: "image", typeName: "asset",
                props: { name: "recommended", src: stickerUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
                meta: {},
              }]);
              editor.createShape({
                id: createShapeId(), type: "image",
                x: solutionsFrame.x + newConfX + CONF_STICKY - dW + 20,
                y: solutionsFrame.y + newConfY + CONF_STICKY - 50,
                props: { assetId, w: dW, h: dH },
                meta: { createdBy: "ai" },
              });
            }
          }

          // Extend frame height if needed
          const cardH = docH + (CONF_STICKY - CONF_OVERLAP) + 24;
          const neededH = PAD + TITLE_H + cardH + PAD;
          if (neededH > frameH) {
            editor.updateShape({
              id: frameId, type: "frame",
              props: { h: neededH },
            });
          }

          shapeId = frameId;
        }
      }

      if (toolName === "createWorkshopBoard") {
        const { title, options } = args as {
          title?: string;
          options?: Array<{ title: string; points: string[] }>;
        };

        const workshopTitle = title || "Decision Time";
        const opts = (options || []).slice(0, 3);

        // Layout constants — based on actual tldraw note auto-sizes:
        // size "s" → ~200×200, "m" → ~266×266, "l" → ~354×354
        const pad = 50;
        const sectionGap = 40;
        const titleTextH = 70;       // "Decision Time" text height
        const noteMH = 266;          // auto-height of size "m" note
        const noteSH = 200;          // auto-height of size "s" note
        const noteSW = 200;          // auto-width of size "s" note
        const noteMW = 266;          // auto-width of size "m" note
        const buttonH = 50;

        // Column sizing: 3 small stickies side by side = 3×200 + 2×20 = 640
        const detailGap = 20;
        const colW = noteSW * 3 + detailGap * 2;   // 640
        const colGap = 60;
        const frameW = pad * 2 + colW * 3 + colGap * 2;  // 2140
        const colStartX = pad;

        // Option colors: [title sticky color, detail sticky color, button border color]
        type WsColor = "blue" | "light-blue" | "red" | "light-red" | "orange" | "yellow";
        const optionColors: Array<[WsColor, WsColor, WsColor]> = [
          ["light-blue", "light-blue", "blue"],
          ["red", "red", "red"],
          ["yellow", "yellow", "orange"],
        ];

        // ── Estimate frame height ──
        const frameH = pad + titleTextH + sectionGap + noteMH + sectionGap + noteSH + sectionGap + buttonH + pad;

        // ── Create parent frame ──
        const engine = getPlacementEngine();
        const framePos = engine.place({ category: "format", width: frameW, height: frameH });
        const frameId = createShapeId();

        // Collect all shapes into an array, then create in one call (single re-render)
        const shapes: any[] = [];

        // ── Frame ──
        shapes.push({
          id: frameId,
          type: "frame",
          x: framePos.x,
          y: framePos.y,
          props: { name: "", w: frameW, h: frameH },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(frameId as unknown as string, { category: "format", width: frameW, height: frameH }, framePos);

        let cursorY = pad;

        // ── 1. Title text — "Decision Time" top-left ──
        shapes.push({
          id: createShapeId(),
          type: "text",
          x: pad,
          y: cursorY,
          parentId: frameId,
          props: { richText: toRichText(workshopTitle), size: "xl", font: "sans", color: "black" },
          meta: { createdBy: "ai" },
        });

        // Dot config (created LAST so they render on top of stickies)
        const dotSize = 44;
        const dotGap = 10;
        const dotsPerRow = 5;
        const dotRows = 2;
        const dotsBlockW = dotsPerRow * dotSize + (dotsPerRow - 1) * dotGap;
        const dotsStartX = frameW - pad - dotsBlockW;
        const dotsY = pad;

        cursorY += titleTextH + sectionGap;

        // ── 3. Per-option columns ──
        const titleStickyY = cursorY;
        const detailStickyY = titleStickyY + noteMH + sectionGap;
        const btnY = detailStickyY + noteSH + sectionGap;

        for (let i = 0; i < 3; i++) {
          const opt = opts[i] || { title: `Option ${i + 1}`, points: ["Point 1", "Point 2", "Point 3"] };
          const [titleColor, detailColor, buttonColor] = optionColors[i];
          const colX = colStartX + i * (colW + colGap);

          // ── 3a. Title sticky — medium size, centered in column ──
          shapes.push({
            id: createShapeId(),
            type: "note",
            x: colX + (colW - noteMW) / 2,
            y: titleStickyY,
            rotation: noteRotation(),
            parentId: frameId,
            props: { richText: toRichText(opt.title), color: titleColor, font: "sans", size: "m" },
            meta: { createdBy: "ai" },
          });

          // ── 3b. Detail stickies — 3 small notes in a row below title ──
          const points = opt.points.slice(0, 3);
          while (points.length < 3) points.push("");

          for (let p = 0; p < 3; p++) {
            shapes.push({
              id: createShapeId(),
              type: "note",
              x: colX + p * (noteSW + detailGap),
              y: detailStickyY,
              rotation: noteRotation(),
              parentId: frameId,
              props: { richText: toRichText(points[p]), color: detailColor, font: "sans", size: "s" },
              meta: { createdBy: "ai" },
            });
          }

          // ── 3c. "Let's gooooo" button — border-only rectangle, centered ──
          const btnW = 200;
          shapes.push({
            id: createShapeId(),
            type: "geo",
            x: colX + (colW - btnW) / 2,
            y: btnY,
            parentId: frameId,
            props: { geo: "rectangle", w: btnW, h: buttonH, color: buttonColor, fill: "none", dash: "draw", size: "m", richText: toRichText("Let's gooooo"), font: "sans" },
            meta: { createdBy: "ai" },
          });
        }

        // ── 4. Red voting dots — LAST so they render on top of stickies ──
        const dotIds: ReturnType<typeof createShapeId>[] = [];
        for (let row = 0; row < dotRows; row++) {
          for (let col = 0; col < dotsPerRow; col++) {
            const dotId = createShapeId();
            dotIds.push(dotId);
            shapes.push({
              id: dotId,
              type: "geo",
              x: dotsStartX + col * (dotSize + dotGap),
              y: dotsY + row * (dotSize + dotGap),
              parentId: frameId,
              props: { geo: "ellipse", w: dotSize, h: dotSize, color: "red", fill: "solid", dash: "solid", size: "s" },
              meta: { createdBy: "ai" },
            });
          }
        }

        // Single call — one re-render for all ~27 shapes
        editor.createShapes(shapes);

        // Bring dots to front so they're always on top of stickies
        editor.bringToFront(dotIds);

        // Final frame height adjustment
        const finalH = btnY + buttonH + pad;
        editor.updateShape({ id: frameId, type: "frame", props: { h: finalH } });

        shapeId = frameId;
      }

      if (toolName === "createArrow") {
        const { startX, startY, endX, endY, fromShapeId, toShapeId } = args as {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
          fromShapeId?: string;
          toShapeId?: string;
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
          meta: { createdBy: "ai" },
        });

        // Create bindings if shape IDs are provided
        if (fromShapeId) {
          editor.createBinding({
            id: createBindingId(),
            type: "arrow",
            fromId: shapeId,
            toId: fromShapeId as TLShapeId,
            props: {
              terminal: "start",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
              snap: "none",
            },
          });
        }
        if (toShapeId) {
          editor.createBinding({
            id: createBindingId(),
            type: "arrow",
            fromId: shapeId,
            toId: toShapeId as TLShapeId,
            props: {
              terminal: "end",
              normalizedAnchor: { x: 0.5, y: 0.5 },
              isExact: false,
              isPrecise: false,
              snap: "none",
            },
          });
        }
      }

      // Working notes - larger sticky with distinct color
      if (toolName === "createWorkingNote") {
        const { title, content } = args as {
          title: string;
          content: string;
        };

        // Working notes are larger - approximately 300x300
        const engine = getPlacementEngine();
        const pos = engine.place({ category: "widget", width: 300, height: 300 });

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x: pos.x,
          y: pos.y,
          rotation: noteRotation(),
          props: {
            richText: toRichText(`${title}\n\n${content}`),
            color: "light-violet",
            font: "sans",
            size: "l",
          },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(shapeId, { category: "widget", width: 300, height: 300 }, pos);
      }

      // CREATE LAYOUT - use tldraw native layout for grids, custom for hierarchy
      if (toolName === "createLayout") {
        const layout = args as {
          type: LayoutType;
          frameName: string;
          replaceFrame?: string;
          parentFrameId?: string;
          items: Array<{
            type: "sticky" | "shape" | "text";
            text: string;
            color?: string;
            parentIndex?: number;
            column?: number;
          }>;
          columns?: number;
          timeLabels?: string[];
          direction?: "down" | "right";
          spacing?: "compact" | "normal" | "spacious";
        };

        // Delete old frame if replacing — capture position first
        let replacePosition: { x: number; y: number } | undefined;
        if (layout.replaceFrame) {
          const allShapes = editor.getCurrentPageShapes();
          const frameToDelete = allShapes.find(
            (s) => s.type === "frame" &&
            ((s.props as { name?: string }).name === layout.replaceFrame ||
             (s.props as { name?: string }).name?.includes(layout.replaceFrame!))
          );
          if (frameToDelete) {
            replacePosition = { x: frameToDelete.x, y: frameToDelete.y };
            const shapesInFrame = allShapes.filter((s) => s.parentId === frameToDelete.id);
            shapesInFrame.forEach((shape) => editor.deleteShape(shape.id));
            editor.deleteShape(frameToDelete.id);
          }
        }

        // HIERARCHY layout: Always use layout engine for clean columnar structure
        // Triggers when: type="hierarchy" OR any item has parentIndex set
        const hasParentIndex = layout.items.some(item => item.parentIndex !== undefined && item.parentIndex !== -1);

        // 🚨 DEFENSIVE FIX: If AI calls "hierarchy" but there are NO parent relationships,
        // convert to a grid with stickies instead (this is what they probably wanted)
        if (layout.type === "hierarchy" && !hasParentIndex) {
          console.log('[LAYOUT] Converting hierarchy with no relationships to grid with stickies');
          layout.type = "grid";
          // Convert all items to stickies for brainstorming
          layout.items.forEach(item => {
            if (item.type === "shape") item.type = "sticky";
          });
        }

        const useHierarchyLayout = (layout.type === "hierarchy" || hasParentIndex) && hasParentIndex;

        if (useHierarchyLayout) {
          console.log('[LAYOUT] Using hierarchy layout engine');

          // Measure each item using tldraw's actual text rendering engine
          // This replaces estimation with pixel-perfect dimensions
          const LABEL_PADDING = 16;
          const measureOpts = {
            fontStyle: "normal",
            fontWeight: "normal",
            fontFamily: "var(--tl-font-sans)",
            fontSize: 22, // LABEL_FONT_SIZES.m (geo shapes use size "m")
            lineHeight: 1.35, // TEXT_PROPS.lineHeight
            padding: "0px",
            minWidth: 14, // MIN_WIDTHS.m
          };

          const layoutItems: LayoutItem[] = layout.items.map((item) => {
            const richText = toRichText(item.text || "");
            const html = renderHtmlFromRichTextForMeasurement(editor, richText);

            // Measure at generous maxWidth to get natural text width
            const naturalSize = editor.textMeasure.measureHtml(html, {
              ...measureOpts,
              maxWidth: 9999,
            });

            // Cap the text area width: min 120px, max 220px
            const textWidth = Math.max(120, Math.min(naturalSize.w, 220));
            const shapeWidth = textWidth + LABEL_PADDING * 2;

            // Measure again at actual width to get wrapped height
            const wrappedSize = editor.textMeasure.measureHtml(html, {
              ...measureOpts,
              maxWidth: textWidth,
            });
            const shapeHeight = Math.max(wrappedSize.h + LABEL_PADDING * 2, 50);

            console.log(`[MEASURE] "${item.text?.slice(0,25)}..." → ${shapeWidth}x${shapeHeight} (text: ${naturalSize.w}w, wrapped: ${wrappedSize.h}h)`);

            return {
              type: "shape" as const,
              text: item.text,
              color: item.color,
              parentIndex: item.parentIndex === -1 ? undefined : item.parentIndex,
              measuredWidth: shapeWidth,
              measuredHeight: shapeHeight,
            };
          });

          const options: LayoutOptions = {
            columns: layout.columns,
            direction: layout.direction,
            spacing: layout.spacing,
          };

          const result = calculateLayout("hierarchy", layoutItems, options);

          let canvasPos: { x: number; y: number };
          if (layout.parentFrameId) {
            const zoneEngine = getZoneEngineForFrame(layout.parentFrameId);
            if (zoneEngine) {
              canvasPos = zoneEngine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
              const newH = zoneEngine.recordPlacement(`layout-hierarchy-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
              maybeResizeParentFrame(layout.parentFrameId, newH);
            } else {
              const engine = getPlacementEngine();
              canvasPos = engine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
              engine.recordPlacement(`layout-hierarchy-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
            }
          } else {
            const engine = getPlacementEngine();
            canvasPos = engine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
            engine.recordPlacement(`layout-hierarchy-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
          }

          // Create frame
          const frameId = createShapeId();
          editor.createShape({
            id: frameId,
            type: "frame",
            x: canvasPos.x,
            y: canvasPos.y,
            ...(layout.parentFrameId ? { parentId: layout.parentFrameId as any } : {}),
            props: {
              name: layout.frameName,
              w: result.frame.width,
              h: result.frame.height,
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(frameId);

          // Create items INSIDE frame with RELATIVE coordinates
          // ALWAYS use geo shapes - stickies auto-size and cause overlap
          result.items.forEach(({ item, position }, index) => {
            const itemId = createShapeId();
            const originalItem = layout.items[index];

            console.log(`[LAYOUT] Creating hierarchy item ${index}: ${item.text?.slice(0,20)}... at (${position.x}, ${position.y}) size ${position.width}x${position.height}`);

            // ALWAYS create geo shape (rectangle) for predictable sizing
            editor.createShape({
              id: itemId,
              type: "geo",
              x: position.x,
              y: position.y,
              parentId: frameId,
              props: {
                geo: "rectangle",
                w: position.width,
                h: position.height,
                color: colorMap[originalItem.color || item.color || "blue"] || "blue",
                font: "sans",
                dash: "solid",
                fill: "solid",
                richText: toRichText(item.text || ""),
              },
              meta: { createdBy: "ai" },
            });
            createdShapesRef.current.push(itemId);
          });

          // Create arrows inside frame with relative coordinates
          result.arrows.forEach((arrow) => {
            const arrowId = createShapeId();
            editor.createShape({
              id: arrowId,
              type: "arrow",
              x: arrow.startX,  // Relative to frame
              y: arrow.startY,  // Relative to frame
              parentId: frameId,  // Child of frame
              props: {
                start: { x: 0, y: 0 },
                end: {
                  x: arrow.endX - arrow.startX,
                  y: arrow.endY - arrow.startY,
                },
              },
              meta: { createdBy: "ai" },
            });
            createdShapesRef.current.push(arrowId);
          });

          return;
        }

        // TIMELINE layout: vertical — periods top-to-bottom, items beside each period
        if (layout.type === "timeline") {
          console.log('[LAYOUT] Using timeline layout engine');

          // Reuse same measurement constants as hierarchy
          const TL_LABEL_PADDING = 16;
          const tlMeasureOpts = {
            fontStyle: "normal",
            fontWeight: "normal",
            fontFamily: "var(--tl-font-sans)",
            fontSize: 22,
            lineHeight: 1.35,
            padding: "0px",
            minWidth: 14,
          };

          const layoutItems: LayoutItem[] = layout.items.map((item) => {
            const richText = toRichText(item.text || "");
            const html = renderHtmlFromRichTextForMeasurement(editor, richText);
            // Timeline items use a fixed-ish width, measure height for wrapping
            const itemTextWidth = 200 - TL_LABEL_PADDING * 2;
            const wrappedSize = editor.textMeasure.measureHtml(html, {
              ...tlMeasureOpts,
              maxWidth: itemTextWidth,
            });
            return {
              type: "shape" as const,
              text: item.text,
              color: item.color,
              column: item.column === -1 ? undefined : item.column,
              measuredHeight: Math.max(wrappedSize.h + TL_LABEL_PADDING * 2, 50),
            };
          });

          const options: LayoutOptions = {
            timeLabels: layout.timeLabels,
            spacing: layout.spacing,
          };

          const result = calculateLayout("timeline", layoutItems, options);

          let canvasPos: { x: number; y: number };
          if (layout.parentFrameId) {
            const zoneEngine = getZoneEngineForFrame(layout.parentFrameId);
            if (zoneEngine) {
              canvasPos = zoneEngine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
              const newH = zoneEngine.recordPlacement(`layout-timeline-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
              maybeResizeParentFrame(layout.parentFrameId, newH);
            } else {
              const engine = getPlacementEngine();
              canvasPos = engine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
              engine.recordPlacement(`layout-timeline-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
            }
          } else {
            const engine = getPlacementEngine();
            canvasPos = engine.place({ category: "format", width: result.frame.width, height: result.frame.height, replacePosition });
            engine.recordPlacement(`layout-timeline-${Date.now()}`, { category: "format", width: result.frame.width, height: result.frame.height }, canvasPos);
          }

          // Create frame
          const frameId = createShapeId();
          editor.createShape({
            id: frameId,
            type: "frame",
            x: canvasPos.x,
            y: canvasPos.y,
            ...(layout.parentFrameId ? { parentId: layout.parentFrameId as any } : {}),
            props: {
              name: layout.frameName,
              w: result.frame.width,
              h: result.frame.height,
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(frameId);

          // Render decorations (time labels, dots, connecting bar)
          if (result.decorations) {
            for (const dec of result.decorations) {
              const decId = createShapeId();

              if (dec.type === "text") {
                // Time period label
                editor.createShape({
                  id: decId,
                  type: "text",
                  x: dec.x,
                  y: dec.y,
                  parentId: frameId,
                  props: {
                    richText: toRichText(dec.text),
                    color: "grey" as TLColor,
                    size: "m",
                    textAlign: "start",
                    w: dec.width,
                  },
                  meta: { createdBy: "ai" },
                });
              } else if (dec.type === "bar") {
                // Vertical connecting bar
                editor.createShape({
                  id: decId,
                  type: "geo",
                  x: dec.x,
                  y: dec.y,
                  parentId: frameId,
                  props: {
                    geo: "rectangle",
                    w: dec.width,
                    h: dec.height,
                    color: "grey" as TLColor,
                    fill: "solid",
                    richText: toRichText(""),
                  },
                  meta: { createdBy: "ai" },
                });
              } else if (dec.type === "dot") {
                // Dot marker at each column
                editor.createShape({
                  id: decId,
                  type: "geo",
                  x: dec.x - dec.radius,
                  y: dec.y - dec.radius,
                  parentId: frameId,
                  props: {
                    geo: "ellipse",
                    w: dec.radius * 2,
                    h: dec.radius * 2,
                    color: "grey" as TLColor,
                    fill: "solid",
                    richText: toRichText(""),
                  },
                  meta: { createdBy: "ai" },
                });
              }
              createdShapesRef.current.push(decId);
            }
          }

          // Create items (shapes grouped by period — order may differ from input)
          result.items.forEach(({ item, position }) => {
            const itemId = createShapeId();

            editor.createShape({
              id: itemId,
              type: "geo",
              x: position.x,
              y: position.y,
              parentId: frameId,
              props: {
                geo: "rectangle",
                w: position.width,
                h: position.height,
                color: colorMap[item.color || "blue"] || "blue",
                font: "sans",
                dash: "solid",
                fill: "solid",
                richText: toRichText(item.text || ""),
              },
              meta: { createdBy: "ai" },
            });
            createdShapesRef.current.push(itemId);
          });

          return;
        }

        // GRID: Real sticky notes for brainstorming
        // FLOW: Shapes for processes
        const isGrid = layout.type === "grid" || layout.type === undefined;
        console.log('[LAYOUT] Using', isGrid ? 'GRID (stickies)' : 'FLOW (shapes)', 'with', layout.items.length, 'items');

        // Settings
        const columns = layout.columns || 3;
        const itemWidth = 220;
        const shapeHeight = 120; // Fixed height for non-sticky shapes
        const gapX = layout.spacing === "compact" ? 40 : layout.spacing === "spacious" ? 80 : 60;
        const gapY = layout.spacing === "compact" ? 40 : layout.spacing === "spacious" ? 80 : 60;
        const padding = 80;
        const titleSpace = 70;

        // For grids: calculate actual height per item based on text, then per-row max
        const rows = Math.ceil(layout.items.length / columns);
        const actualCols = Math.min(columns, layout.items.length);

        // Calculate individual item heights for stickies
        const itemHeights = layout.items.map((item: { text?: string }) => {
          if (!isGrid) return shapeHeight;
          const text = item.text || '';
          // Sticky note text height estimation:
          // tldraw note width is ~200px usable, font is ~14px bold → ~12 chars/line
          const charsPerLine = 14;
          const lineHeight = 28; // tldraw note line height with bold font
          const verticalPadding = 80; // top + bottom padding inside note
          const lines = Math.ceil(text.length / charsPerLine);
          return Math.max(200, lines * lineHeight + verticalPadding);
        });

        // Calculate per-row max heights
        const rowHeights: number[] = [];
        for (let r = 0; r < rows; r++) {
          let maxH = 0;
          for (let c = 0; c < columns; c++) {
            const idx = r * columns + c;
            if (idx < itemHeights.length) maxH = Math.max(maxH, itemHeights[idx]);
          }
          rowHeights.push(maxH);
        }

        // Cumulative Y offsets per row
        const rowYOffsets = [0];
        for (let r = 0; r < rowHeights.length; r++) {
          rowYOffsets.push(rowYOffsets[r] + rowHeights[r] + gapY);
        }

        const frameWidth = padding * 2 + actualCols * itemWidth + (actualCols - 1) * gapX;
        const frameHeight = padding + titleSpace + rowYOffsets[rows] + padding;

        let canvasPos: { x: number; y: number };
        if (layout.parentFrameId) {
          const zoneEngine = getZoneEngineForFrame(layout.parentFrameId);
          if (zoneEngine) {
            canvasPos = zoneEngine.place({ category: "format", width: frameWidth, height: frameHeight, replacePosition });
            const newH = zoneEngine.recordPlacement(`layout-grid-${Date.now()}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
            maybeResizeParentFrame(layout.parentFrameId, newH);
          } else {
            const engine = getPlacementEngine();
            canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight, replacePosition });
            engine.recordPlacement(`layout-grid-${Date.now()}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
          }
        } else {
          const engine = getPlacementEngine();
          canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight, replacePosition });
          engine.recordPlacement(`layout-grid-${Date.now()}`, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
        }
        console.log('[LAYOUT] Frame at', canvasPos, 'size', frameWidth, 'x', frameHeight);

        // Create frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          ...(layout.parentFrameId ? { parentId: layout.parentFrameId as any } : {}),
          props: {
            name: layout.frameName,
            w: frameWidth,
            h: frameHeight,
          },
          meta: { createdBy: "ai" },
        });
        createdShapesRef.current.push(frameId);

        // Create items
        layout.items.forEach((item, index) => {
          const col = index % columns;
          const row = Math.floor(index / columns);
          const itemId = createShapeId();

          // Position in grid — use per-row cumulative offsets for variable heights
          const x = padding + col * (itemWidth + gapX);
          const y = titleSpace + padding + rowYOffsets[row];

          if (isGrid) {
            // GRID: Real sticky notes (post-its)
            editor.createShape({
              id: itemId,
              type: "note",
              x,
              y,
              rotation: noteRotation(),
              parentId: frameId,
              props: {
                richText: toRichText(item.text || ""),
                color: randomStickyColor(),
                font: "sans",
                size: "s",
              },
              meta: { createdBy: "ai" },
            });
          } else {
            // FLOW: Geo shapes
            editor.createShape({
              id: itemId,
              type: "geo",
              x,
              y,
              parentId: frameId,
              props: {
                geo: "rectangle",
                w: itemWidth,
                h: shapeHeight,
                color: colorMap[item.color || "blue"] || "blue",
                font: "sans",
                dash: "solid",
                fill: "solid",
                richText: toRichText(item.text || ""),
              },
              meta: { createdBy: "ai" },
            });
          }
          createdShapesRef.current.push(itemId);
        });

        console.log('[LAYOUT] Created', layout.items.length, 'items in', rows, 'rows x', actualCols, 'cols');
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

      // Delete frame and all its contents
      if (toolName === "deleteFrame") {
        const { frameName } = args as { frameName: string };
        const allShapes = editor.getCurrentPageShapes();

        // Find frame by name (exact match or contains)
        const frameToDelete = allShapes.find(
          (s) => s.type === "frame" &&
          ((s.props as { name?: string }).name === frameName ||
           (s.props as { name?: string }).name?.includes(frameName))
        );

        if (frameToDelete) {
          // Get all shapes inside the frame
          const shapesInFrame = allShapes.filter(
            (s) => s.parentId === frameToDelete.id
          );

          // Delete all children first
          shapesInFrame.forEach((shape) => {
            editor.deleteShape(shape.id);
          });

          // Then delete the frame itself
          editor.deleteShape(frameToDelete.id);

          console.log(`[CANVAS] Deleted frame "${frameName}" and ${shapesInFrame.length} items inside`);
        } else {
          console.warn(`[CANVAS] Frame "${frameName}" not found`);
        }
      }

      // CREATE SOURCES - display web search results as bookmark cards
      if (toolName === "createSources") {
        const { title, sources } = args as {
          title: string;
          sources: Array<{ title: string; url: string; description?: string; image?: string }>
        };

        // Bookmark dimensions and layout
        const bookmarkWidth = 300;
        const bookmarkHeightWithImage = 320;
        const bookmarkHeightNoImage = 100;  // Compact: just title + domain
        const gapX = 40;
        const gapY = 30;
        const columns = 2;
        const padding = 60;
        const bottomPadding = 80;

        // Determine height per source based on whether it has an image
        const sourceHeights = sources.map(s => s.image ? bookmarkHeightWithImage : bookmarkHeightNoImage);

        // Calculate frame height: sum of row heights (max height in each row)
        const rows = Math.ceil(sources.length / columns);
        const rowHeights: number[] = [];
        for (let r = 0; r < rows; r++) {
          let maxH = 0;
          for (let c = 0; c < columns; c++) {
            const idx = r * columns + c;
            if (idx < sourceHeights.length) maxH = Math.max(maxH, sourceHeights[idx]);
          }
          rowHeights.push(maxH);
        }
        const frameWidth = columns * bookmarkWidth + (columns + 1) * gapX + padding * 2;
        const frameHeight = rowHeights.reduce((sum, h) => sum + h, 0) + (rows + 1) * gapY + padding + bottomPadding;

        // Find empty space on canvas
        const engine = getPlacementEngine();
        const canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight });

        // Create frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          props: {
            name: title,
            w: frameWidth,
            h: frameHeight,
          },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(frameId, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
        createdShapesRef.current.push(frameId);

        // Create bookmark assets and shapes for each source
        // Track cumulative Y offsets per row for variable-height cards
        const rowYOffsets: number[] = [0];
        for (let r = 0; r < rowHeights.length; r++) {
          rowYOffsets.push(rowYOffsets[r] + rowHeights[r] + gapY);
        }

        sources.forEach((source, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);
          const thisHeight = sourceHeights[i];

          // Relative position inside frame
          const relativeX = padding + col * (bookmarkWidth + gapX);
          const relativeY = padding + rowYOffsets[row];

          // Extract domain for favicon
          let favicon = "";
          try {
            const domain = new URL(source.url).hostname;
            favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
          } catch { /* ignore bad URLs */ }

          // Create bookmark asset with metadata including image
          const assetId = `asset:bookmark-${Date.now()}-${i}` as any;
          editor.createAssets([{
            id: assetId,
            type: "bookmark",
            typeName: "asset",
            props: {
              src: source.url,
              title: source.title || "",
              description: source.description || "",
              image: source.image || "",
              favicon,
            },
            meta: {},
          }]);

          // Create bookmark shape referencing the asset
          const bookmarkId = createShapeId();
          editor.createShape({
            id: bookmarkId,
            type: "bookmark",
            x: relativeX,
            y: relativeY,
            parentId: frameId,
            props: {
              url: source.url,
              assetId: assetId,
              w: bookmarkWidth,
              h: thisHeight,
            },
            meta: { createdBy: "ai" },
          });
          createdShapesRef.current.push(bookmarkId);
        });

        console.log(`[CANVAS] Created sources frame "${title}" with ${sources.length} bookmarks`);
        return;
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
          // Map AI color names to tldraw color values
          type NoteColor = "yellow" | "blue" | "green" | "orange" | "violet" | "black" | "red" | "grey" | "light-blue" | "light-green" | "light-red" | "light-violet" | "white";
          const stickyColorMap: Record<string, NoteColor> = {
            yellow: "yellow", blue: "blue", green: "green",
            red: "red", pink: "red", orange: "orange", violet: "violet",
          };
          const mappedColor: NoteColor = stickyColorMap[newColor] || stickyColorMap[newColor?.toLowerCase()] || "yellow";

          editor.updateShape({
            id: shapeToUpdate.id,
            type: "note",
            props: {
              richText: toRichText(newText),
              color: mappedColor,
            },
          });

          // If this is a confidence sticky, reposition it to the bottom of its doc
          const isConfidence = newText.toLowerCase().includes("confidence");
          if (isConfidence && shapeToUpdate.parentId) {
            // Find document shapes in the same frame
            const siblings = allShapes.filter(s => s.parentId === shapeToUpdate.parentId);
            const docs = siblings.filter(s => s.type === "document");

            // Find the doc closest to this sticky's X position (same column)
            const stickyX = shapeToUpdate.x;
            const stickyW = 200; // "s" note size
            let bestDoc: typeof docs[0] | null = null;
            let bestDist = Infinity;
            for (const doc of docs) {
              const docW = (doc.props as any).w || 500;
              const docCenterX = doc.x + docW / 2;
              const stickyCenterX = stickyX + stickyW / 2;
              const dist = Math.abs(docCenterX - stickyCenterX);
              if (dist < bestDist) {
                bestDist = dist;
                bestDoc = doc;
              }
            }

            if (bestDoc) {
              const docW = (bestDoc.props as any).w || 500;
              const docH = (bestDoc.props as any).h || 400;
              const CONF_OVERLAP = 60;
              // Center sticky under the doc, overlapping by CONF_OVERLAP
              const newX = bestDoc.x + Math.floor((docW - stickyW) / 2);
              const newY = bestDoc.y + docH - CONF_OVERLAP;
              editor.updateShape({
                id: shapeToUpdate.id,
                type: "note",
                x: newX,
                y: newY,
              });

              // If color is green → this is the new recommended solution
              // Move (or create) the RECOMMENDED sticker image on this sticky
              if (mappedColor === "green") {
                const CONF_STICKY = 200;
                const frame = editor.getShape(shapeToUpdate.parentId as any);
                const frameX = frame?.x || 0;
                const frameY = frame?.y || 0;

                const images = allShapes.filter(s => s.type === "image");
                const recSticker = images.find(img => {
                  const assetId = (img.props as any).assetId || "";
                  return assetId.includes("sticker-recommended");
                });

                const stickerX = frameX + newX + CONF_STICKY - 140 + 20;
                const stickerY = frameY + newY + CONF_STICKY - 50;

                if (recSticker) {
                  // Move existing sticker
                  editor.updateShape({
                    id: recSticker.id,
                    type: "image",
                    x: stickerX,
                    y: stickerY,
                  });
                } else {
                  // Sticker doesn't exist — create it
                  const stickerUrl = "https://mirostatic.com/stickers/general-task-tacklers__2/task_tacklers_recommended.svg";
                  const dW = 140, dH = 140;
                  const assetId = `asset:sticker-recommended-${Date.now()}-${Math.random().toString(36).slice(2, 5)}` as any;
                  editor.createAssets([{
                    id: assetId, type: "image", typeName: "asset",
                    props: { name: "recommended", src: stickerUrl, w: 200, h: 200, mimeType: "image/svg+xml", isAnimated: false },
                    meta: {},
                  }]);
                  editor.createShape({
                    id: createShapeId(), type: "image",
                    x: stickerX,
                    y: stickerY,
                    props: { assetId, w: dW, h: dH },
                    meta: { createdBy: "ai" },
                  });
                }
              }
            }
          }
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

      // Organize existing items into a frame
      if (toolName === "organizeIntoFrame") {
        const { frameName, itemIds, layout } = args as {
          frameName: string;
          itemIds: string[];
          layout: "row" | "column" | "grid";
        };

        const allShapes = editor.getCurrentPageShapes();

        // Find the actual shapes by ID
        const shapesToMove = itemIds
          .map(id => allShapes.find(s => s.id === id || s.id === `shape:${id}`))
          .filter(Boolean) as typeof allShapes;

        if (shapesToMove.length === 0) return;

        // Get dimensions of each shape
        const shapeInfos = shapesToMove.map(s => {
          const bounds = editor.getShapeGeometry(s.id).bounds;
          return { shape: s, width: bounds.width, height: bounds.height };
        });

        // Calculate layout positions
        const padding = 60;
        const gap = 40;
        const titleSpace = 50;
        const maxItemWidth = Math.max(...shapeInfos.map(s => s.width));
        const maxItemHeight = Math.max(...shapeInfos.map(s => s.height));

        let frameWidth: number, frameHeight: number;
        const positions: Array<{ x: number; y: number }> = [];

        if (layout === "column") {
          frameWidth = padding * 2 + maxItemWidth;
          let yPos = titleSpace + padding;
          shapeInfos.forEach(si => {
            positions.push({ x: padding, y: yPos });
            yPos += si.height + gap;
          });
          frameHeight = yPos + padding;
        } else if (layout === "grid") {
          const cols = Math.ceil(Math.sqrt(shapesToMove.length));
          const rows = Math.ceil(shapesToMove.length / cols);
          frameWidth = padding * 2 + cols * maxItemWidth + (cols - 1) * gap;
          frameHeight = titleSpace + padding * 2 + rows * maxItemHeight + (rows - 1) * gap;
          shapeInfos.forEach((_, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            positions.push({
              x: padding + col * (maxItemWidth + gap),
              y: titleSpace + padding + row * (maxItemHeight + gap),
            });
          });
        } else {
          // Row (default)
          let xPos = padding;
          frameWidth = padding;
          shapeInfos.forEach(si => {
            positions.push({ x: xPos, y: titleSpace + padding });
            xPos += si.width + gap;
          });
          frameWidth = xPos + padding;
          frameHeight = titleSpace + padding * 2 + maxItemHeight;
        }

        // Find empty space for the frame
        const engine = getPlacementEngine();
        const canvasPos = engine.place({ category: "format", width: frameWidth, height: frameHeight });

        // Create the frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          props: {
            name: frameName,
            w: frameWidth,
            h: frameHeight,
          },
          meta: { createdBy: "ai" },
        });
        engine.recordPlacement(frameId, { category: "format", width: frameWidth, height: frameHeight }, canvasPos);
        createdShapesRef.current.push(frameId);

        // Move each shape into the frame with new positions
        shapesToMove.forEach((shape, i) => {
          editor.updateShape({
            id: shape.id,
            type: shape.type,
            x: positions[i].x,
            y: positions[i].y,
            parentId: frameId,
          } as any);
        });

        console.log(`[CANVAS] Organized ${shapesToMove.length} items into frame "${frameName}"`);
        return;
      }

      // Track created shape (removed auto-zoom - was too jumpy)
      if (shapeId) {
        createdShapesRef.current.push(shapeId);
      }
      } catch (err) {
        console.error(`[handleToolCall] Error handling ${toolName}:`, err);
      } finally {
        // ALWAYS reset the flag, even if we return early
        isProcessingToolCallRef.current = false;
      }
    },
    [editor, getPlacementEngine]
  );

  // Get and clear pending user edits (consumed on each chat request)
  const getUserEdits = useCallback(() => {
    const edits = [...userEditsRef.current];
    userEditsRef.current = [];
    return edits;
  }, []);

  // Detect user edits to AI-created shapes
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.store.listen((entry) => {
      // Skip changes made by AI tool calls
      if (isProcessingToolCallRef.current) return;

      // Helper to extract text from richText prop
      const extractTextFromRichText = (rt: unknown): string => {
        if (!rt) return "";
        const richText = rt as { content?: Array<{ content?: Array<{ text?: string }> }> };
        return richText.content
          ?.flatMap((block) => block.content?.map((inline) => inline.text) || [])
          .join("") || "";
      };

      // Track user-created shapes (additions)
      for (const [, shape] of Object.entries(entry.changes.added)) {
        const record = shape as unknown as Record<string, unknown>;

        // Only track shapes (not pages, assets, etc.)
        if (typeof record.typeName !== 'string' || record.typeName !== 'shape') continue;

        // Skip AI-created shapes (only track user additions)
        const meta = record.meta as Record<string, unknown> | undefined;
        if (meta?.createdBy === 'ai') continue;

        const props = record.props as Record<string, unknown>;
        const shapeType = record.type as string;
        const text = extractTextFromRichText(props.richText);

        // Build human-readable description
        let description = "";
        if (shapeType === "note") {
          description = "sticky note";
        } else if (shapeType === "geo") {
          const geoType = props.geo as string || "rectangle";
          description = `${geoType} shape`;
        } else if (shapeType === "arrow") {
          description = "arrow";
        } else if (shapeType === "text") {
          description = "text label";
        } else if (shapeType === "frame") {
          description = "frame";
        } else {
          description = shapeType;
        }

        const textPart = text ? ` with text "${text.slice(0, 40)}"` : "";
        const color = props.color as string | undefined;
        const colorPart = color ? ` (${color})` : "";

        userEditsRef.current.push({
          shapeId: record.id as string,
          field: "added",
          oldValue: "",
          newValue: `${description}${textPart}${colorPart}`
        });

        // If voice mode is active, send canvas update immediately
        if (voiceRef.current?.isConnected) {
          // Small delay to let tldraw finish processing
          setTimeout(() => {
            voiceRef.current?.sendCanvasUpdate();
          }, 150);
        }
      }

      // Track edits to shapes (updates) - track ALL changes, not just AI shapes
      for (const [, change] of Object.entries(entry.changes.updated)) {
        const [before, after] = change as unknown as [Record<string, unknown>, Record<string, unknown>];

        // Only track shapes (not pages, assets, etc.)
        if (typeof before.typeName !== 'string' || before.typeName !== 'shape') continue;

        const beforeProps = before.props as Record<string, unknown>;
        const afterProps = after.props as Record<string, unknown>;
        const shapeId = before.id as string;
        const shapeType = before.type as string;

        // Check text changes
        const oldText = extractTextFromRichText(beforeProps.richText);
        const newText = extractTextFromRichText(afterProps.richText);
        if (oldText !== newText && (oldText || newText)) {
          userEditsRef.current.push({
            shapeId,
            field: "text",
            oldValue: oldText,
            newValue: newText,
          });
        }

        // Check color changes
        const oldColor = beforeProps.color as string | undefined;
        const newColor = afterProps.color as string | undefined;
        if (oldColor !== newColor && newColor) {
          userEditsRef.current.push({
            shapeId,
            field: "color",
            oldValue: oldColor || "default",
            newValue: newColor,
          });
        }

        // Check position changes (moves)
        const oldX = Math.round(before.x as number);
        const oldY = Math.round(before.y as number);
        const newX = Math.round(after.x as number);
        const newY = Math.round(after.y as number);
        if (oldX !== newX || oldY !== newY) {
          userEditsRef.current.push({
            shapeId,
            field: "moved",
            oldValue: `(${oldX}, ${oldY})`,
            newValue: `(${newX}, ${newY})`,
          });
        }
      }

      // Track deletions
      for (const [, shape] of Object.entries(entry.changes.removed)) {
        const record = shape as unknown as Record<string, unknown>;

        // Only track shapes (not pages, assets, etc.)
        if (typeof record.typeName !== 'string' || record.typeName !== 'shape') continue;

        const props = record.props as Record<string, unknown>;
        const shapeType = record.type as string;
        const text = extractTextFromRichText(props.richText);

        // Build human-readable description
        let description = "";
        if (shapeType === "note") {
          description = "sticky note";
        } else if (shapeType === "geo") {
          const geoType = props.geo as string || "rectangle";
          description = `${geoType} shape`;
        } else if (shapeType === "arrow") {
          description = "arrow";
        } else if (shapeType === "text") {
          description = "text label";
        } else if (shapeType === "frame") {
          description = "frame";
        } else {
          description = shapeType;
        }

        const textPart = text ? ` "${text.slice(0, 40)}"` : "";

        userEditsRef.current.push({
          shapeId: record.id as string,
          field: "deleted",
          oldValue: `${description}${textPart}`,
          newValue: "",
        });

        // If voice mode is active, send canvas update for deletions too
        if (voiceRef.current?.isConnected) {
          setTimeout(() => {
            voiceRef.current?.sendCanvasUpdate();
          }, 150);
        }
      }

      // If voice is connected, send screenshot for ANY user shape change (not just tracked edits)
      const isShape = (r: unknown) => (r as Record<string, unknown>).typeName === 'shape';
      const hasShapeChanges =
        Object.values(entry.changes.added).some(isShape) ||
        Object.values(entry.changes.removed).some(isShape) ||
        Object.values(entry.changes.updated).some(([before]) => isShape(before));

      if (userEditsRef.current.length > 0 && voiceRef.current?.isConnected) {
        // Text update fires fast
        setTimeout(() => {
          voiceRef.current?.sendCanvasUpdate();
        }, 200);
      }

      if (hasShapeChanges && voiceRef.current?.isConnected) {
        // Screenshot debounced so drawing strokes don't spam
        // Diff shapes vs last screenshot to tell the AI exactly what's new
        if (screenshotTimerRef.current) {
          clearTimeout(screenshotTimerRef.current);
        }
        screenshotTimerRef.current = setTimeout(() => {
          if (!editor) return;
          const currentShapes = editor.getCurrentPageShapes();
          const prevIds = lastScreenshotShapeIdsRef.current;

          // Find new and removed shapes
          const newShapes = currentShapes.filter(s => !prevIds.has(s.id as string));
          const currentIds = new Set(currentShapes.map(s => s.id as string));
          const removedCount = [...prevIds].filter(id => !currentIds.has(id)).length;

          // Describe what changed
          const parts: string[] = [];
          if (newShapes.length > 0) {
            const descs = newShapes.map(s => {
              const props = s.props as Record<string, unknown>;
              const text = extractText(props);
              const textPart = text ? ` "${text.slice(0, 30)}"` : '';
              if (s.type === 'draw') return 'freehand drawing';
              if (s.type === 'note') return `sticky note${textPart}`;
              if (s.type === 'geo') return `${(props.geo as string) || 'shape'}${textPart}`;
              if (s.type === 'text') return `text${textPart}`;
              if (s.type === 'arrow') return 'arrow';
              if (s.type === 'frame') return `frame "${(props.name as string) || ''}"`;
              return s.type;
            });
            parts.push(`added: ${descs.join(', ')}`);
          }
          if (removedCount > 0) {
            parts.push(`removed ${removedCount} item${removedCount > 1 ? 's' : ''}`);
          }

          // Update tracking
          lastScreenshotShapeIdsRef.current = currentIds;

          const desc = parts.join('; ') || undefined;
          voiceRef.current?.sendScreenshot(desc);
          screenshotTimerRef.current = null;
        }, 400); // Reduced from 800ms to 400ms for faster response
      }
    }, { source: "user", scope: "document" });

    return unsub;
  }, [editor]);

  // Track shape count to hide/show starting prompt cards
  useEffect(() => {
    if (!editor) return;

    const updateShapeCount = () => {
      const shapes = editor.getCurrentPageShapes();
      setShapeCount(shapes.length);
    };

    // Initial count
    updateShapeCount();

    // Only recount when user adds/removes shapes (not on camera moves or AI changes)
    const unsub = editor.store.listen((entry) => {
      const hasAdded = Object.keys(entry.changes.added).length > 0;
      const hasRemoved = Object.keys(entry.changes.removed).length > 0;
      if (hasAdded || hasRemoved) {
        updateShapeCount();
      }
    }, { source: "user", scope: "document" });

    return unsub;
  }, [editor]);

  // Register real canvas handlers on mount — only after editor is ready
  useEffect(() => {
    if (!editor) return; // Wait for tldraw editor to initialize before draining pending tool calls
    registerHandlers({
      handleToolCall,
      getCanvasState,
      getUserEdits,
      navigateToFrames: (names: string[]) => {
        if (!editor) return;
        const allShapes = editor.getCurrentPageShapes();
        // Search frames by props.name, documents/datatables by props.title
        const matches = allShapes.filter((s) => {
          const props = s.props as Record<string, unknown>;
          const shapeName = (props.name as string) || (props.title as string) || "";
          return names.some(n => shapeName.includes(n));
        });
        if (matches.length > 0) {
          editor.select(...matches.map((s) => s.id));
          editor.zoomToSelection({ animation: { duration: 300 } });
        }
      },
    }, true); // isCanvasReady — signals it's safe to drain pending tool calls
  }, [registerHandlers, handleToolCall, getCanvasState, getUserEdits, editor]);

  // Set active canvas on mount, clear on unmount
  useEffect(() => {
    // Extract canvasId and spaceId from URL
    const parts = window.location.pathname.split("/");
    const spaceId = parts[2] || "";
    const canvasId = parts[4] || "";
    if (canvasId) {
      setActiveCanvas({ canvasId, spaceId });
    }
    return () => {
      setActiveCanvas(null);
    };
  }, [setActiveCanvas]);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);

    // Enable dot grid that moves with the camera
    editor.updateInstanceState({ isGridMode: true });

    // Set default styles for all new shapes
    editor.setStyleForNextShapes(DefaultFontStyle, 'sans');
    editor.setStyleForNextShapes(DefaultSizeStyle, 's');
    editor.setStyleForNextShapes(DefaultDashStyle, 'solid');
    editor.setStyleForNextShapes(DefaultFillStyle, 'solid');
    editor.setStyleForNextShapes(DefaultColorStyle, 'black');

    // One-time migration: set colorScheme on existing Gantt charts based on parent frame name
    setTimeout(() => {
      try {
        const shapes = editor.getCurrentPageShapes();
        for (const shape of shapes) {
          if (shape.type === 'ganttchart' && !(shape.props as any).colorScheme) {
            const parent = shape.parentId ? editor.getShape(shape.parentId as any) : null;
            if (parent?.type === 'frame') {
              const name = ((parent.props as any).name || '').toLowerCase();
              let scheme = '';
              if (name.includes('paygrid') || name.includes('prio 1') || name.includes('priority: pay')) scheme = 'green';
              else if (name.includes('firstflex') || name.includes('prio 2') || name.includes('priority: first')) scheme = 'violet';
              if (scheme) {
                editor.updateShape({ id: shape.id, type: shape.type, props: { colorScheme: scheme } } as any);
              }
            }
          }
        }
      } catch (e) {
        // Ignore — migration is best-effort
      }
    }, 3000);

    // Auto-enter editing mode when a single document/table shape is clicked in its interior
    editor.sideEffects.registerAfterChangeHandler('instance_page_state', (prev, next) => {
      const prevSelected = prev.selectedShapeIds;
      const nextSelected = next.selectedShapeIds;

      // Only trigger on selection change, not other page state updates
      if (prevSelected === nextSelected) return;

      // Only auto-edit when exactly one shape is selected
      if (nextSelected.length !== 1) return;

      const shapeId = nextSelected[0];
      const shape = editor.getShape(shapeId);
      if (!shape) return;

      // Auto-edit for document, data table, and gantt chart shapes
      if (shape.type === 'document' || shape.type === 'datatable' || shape.type === 'ganttchart' || shape.type === 'kanbanboard') {
        // Only enter editing if we're not already editing this shape
        if (editor.getEditingShapeId() !== shapeId) {
          // Check if the click landed inside the inner area (past the 20px border)
          // Clicking the 20px boundary just selects without entering editing mode
          const BORDER = 20;
          const point = editor.inputs.currentPagePoint;
          const innerLeft = shape.x + BORDER;
          const innerTop = shape.y + BORDER;
          const innerRight = shape.x + (shape.props as any).w - BORDER;
          const innerBottom = shape.y + (shape.props as any).h - BORDER;

          if (
            point.x >= innerLeft &&
            point.x <= innerRight &&
            point.y >= innerTop &&
            point.y <= innerBottom
          ) {
            editor.setEditingShape(shapeId);
          }
        }
      }
    });
  }, []);

  const handleSubmit = useCallback(
    (text: string, options?: { openPanel?: boolean }) => {
      if (!text.trim()) return;

      // Hide any existing toast immediately when new request starts
      setResponseToast(null);
      setToastCentered(false);
      setCreationToasts([]);
      lastCreationToastedRef.current = null;
      shouldHideToastRef.current = true; // Synchronously hide toast to prevent flicker

      // If voice is connected, send to voice session instead of chat API
      if (voice.isConnected) {
        voice.sendMessage(text);
        // Also add to messages for display
        setMessages((prev) => [...prev, {
          id: `user-voice-${Date.now()}`,
          role: "user" as const,
          content: text,
        }]);
      } else {
        // Normal text chat flow
        append({ role: "user", content: text });
      }

      setInput("");
      // Only open panel if explicitly requested (clicking sparkle button)
      if (options?.openPanel === true) {
        setChatMode("sidepanel");
        setIsCompletionDismissed(true);
      }
    },
    [append, voice, setMessages]
  );

  // Wrapper for disconnect that plays end chime
  const handleVoiceDisconnect = useCallback(() => {
    voice.disconnect();
    // Reset session flags
    hasPlayedStartChimeRef.current = false;
    waitingForGoodbyeRef.current = false;
    goodbyeTranscriptLengthRef.current = 0;
    // Clear stale toast so it doesn't reappear after voice mode ends
    setResponseToast(null);
    setToastCentered(false);
  }, [voice]);

  // Handle voice transcripts - add to message history
  const handleVoiceTranscript = useCallback((text: string, role: "user" | "assistant") => {
    console.log('[VOICE] handleVoiceTranscript called:', { role, text: text.slice(0, 50) });

    // Detect AI's goodbye responses (we control these via instructions)
    // More agentic: Let AI decide if conversation is ending, detect AI's response patterns
    if (role === "assistant") {
      const lowerText = text.toLowerCase().trim();

      // AI goodbye phrases from instructions (route.ts lines 88-92)
      const aiGoodbyePatterns = [
        'shout when you need me',
        'ping me anytime',
        'catch you later',
        'just ping me',
        'talk to you later',
        'see you later',
        'take care'
      ];

      const isAiGoodbye = aiGoodbyePatterns.some(pattern => lowerText.includes(pattern));

      if (isAiGoodbye) {
        console.log('[VOICE] AI said goodbye, will auto-close after audio finishes');
        waitingForGoodbyeRef.current = true;
        // Store transcript length to estimate audio duration
        // Average speaking rate: ~2-2.5 words/second (120-150 words/minute)
        goodbyeTranscriptLengthRef.current = text.split(' ').length;
      }
    }

    setMessages((prev) => {
      // For assistant transcripts, merge with last assistant message if it has no content
      if (role === "assistant" && prev.length > 0) {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === "assistant" && !lastMsg.content) {
          return [...prev.slice(0, -1), { ...lastMsg, content: text }];
        }
      }
      return [...prev, { id: `${role}-voice-${Date.now()}`, role, content: text }];
    });
  }, [setMessages, handleVoiceDisconnect]);

  // Handle voice tool calls (confirmPlan, checkpoint, showProgress) - add to messages
  const handleVoiceMessageToolCall = useCallback((toolCall: { toolName: string; args: Record<string, unknown>; call_id?: string }) => {
    setMessages((prev) => {
      // Merge with last assistant message if it has no toolInvocations
      if (prev.length > 0) {
        const lastMsg = prev[prev.length - 1];
        if (lastMsg.role === "assistant" && !lastMsg.toolInvocations) {
          return [...prev.slice(0, -1), { ...lastMsg, toolInvocations: [{ toolName: toolCall.toolName, args: toolCall.args }] }];
        }
      }
      return [...prev, { id: `assistant-voice-${Date.now()}`, role: "assistant", content: "", toolInvocations: [{ toolName: toolCall.toolName, args: toolCall.args }] }];
    });
  }, [setMessages]);

  // Handle voice mode toggle
  const handleVoiceToggle = useCallback(() => {
    if (voice.isConnected || voice.state === "connecting") {
      handleVoiceDisconnect();
    } else {
      // Don't play chime here - wait until voice is actually listening
      voice.connect(handleToolCall, handleVoiceTranscript, handleVoiceMessageToolCall, getCanvasState, captureScreenshot, messagesRef.current);
    }
  }, [voice, handleToolCall, handleVoiceTranscript, handleVoiceMessageToolCall, getCanvasState, captureScreenshot, handleVoiceDisconnect]);

  // Handle voice state transitions and auto-close
  useEffect(() => {
    if (voice.state === "listening") {
      if (!hasPlayedStartChimeRef.current && !waitingForGoodbyeRef.current) {
        hasPlayedStartChimeRef.current = true;
      }
      // AI said goodbye and finished speaking: auto-close
      // (flag set when AI transcript contains goodbye pattern - agentic detection)
      else if (waitingForGoodbyeRef.current) {
        // Calculate delay based on transcript length
        // OpenAI voice speaking rate: ~3.5 words/second (faster than human conversation)
        // Add minimal 200ms buffer
        const wordCount = goodbyeTranscriptLengthRef.current || 10;
        const estimatedDuration = (wordCount / 3.5) * 1000; // ms
        const delay = estimatedDuration + 200; // Small buffer

        console.log(`[VOICE] AI goodbye complete, auto-closing in ${Math.round(delay)}ms (${wordCount} words)`);
        setTimeout(() => {
          console.log('[VOICE] Executing auto-disconnect');
          handleVoiceDisconnect();
        }, delay);

        waitingForGoodbyeRef.current = false;
        goodbyeTranscriptLengthRef.current = 0;
      }
    }
  }, [voice.state, handleVoiceDisconnect]);

  // Find pending askUser questions (batched - unanswered)
  const pendingQuestions = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const askUserTool = msg.toolInvocations?.find(t => t.toolName === 'askUser');
      if (askUserTool) {
        // Check if there's a user response after this
        const hasResponse = messages.slice(i + 1).some(m => m.role === 'user');
        if (!hasResponse) {
          const args = askUserTool.args as { questions?: Array<{ question: string; suggestions: string[] }>; question?: string; suggestions?: string[] };
          // Support both new batched format and legacy single format
          if (args.questions) {
            return args.questions;
          } else if (args.question) {
            return [{ question: args.question, suggestions: args.suggestions || [] }];
          }
        }
      }
    }
    return null;
  }, [messages]);

  // Current question to show (from batched questions)
  const pendingQuestion = pendingQuestions && currentQuestionIndex < pendingQuestions.length
    ? pendingQuestions[currentQuestionIndex]
    : null;

  // Reset question index when new questions arrive
  useEffect(() => {
    if (pendingQuestions) {
      setCurrentQuestionIndex(0);
      setQuestionAnswers([]);
    }
  }, [pendingQuestions]);

  // Find pending confirmPlan (not yet approved)
  const pendingPlan = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
      if (planTool) {
        // Check if there's a user response after this
        const hasResponse = messages.slice(i + 1).some(m => m.role === 'user');
        if (!hasResponse) {
          const args = planTool.args as { title: string; steps: string[]; summary: string };
          return {
            title: args.title,
            steps: args.steps,
            summary: args.summary,
          };
        }
      }
    }
    return null;
  }, [messages]);

  // Check if there's an active plan (approved, executing, NOT yet fully completed)
  const hasActivePlan = useMemo(() => {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
      if (planTool) {
        // Check if next user message is approval
        const nextMsg = messages[i + 1];
        if (nextMsg?.role === 'user' && nextMsg.content?.toLowerCase().includes('approve')) {
          const args = planTool.args as { steps?: string[] };
          const totalSteps = args.steps?.length ?? 0;

          // Gather all showProgress calls after the plan
          const laterMessages = messages.slice(i + 1).filter(m => m.role === 'assistant');
          const laterToolCalls = laterMessages.flatMap(m => m.toolInvocations || []);
          const progressCalls = laterToolCalls.filter(t => t.toolName === 'showProgress');

          // Count how many steps are completed
          let completedSteps = 0;
          progressCalls.forEach(call => {
            const pargs = call.args as { stepNumber?: number; status?: string };
            if (pargs.status === 'completed' && pargs.stepNumber !== undefined) {
              completedSteps = Math.max(completedSteps, pargs.stepNumber);
            }
          });

          // Plan is done when all steps are completed
          if (totalSteps > 0 && completedSteps >= totalSteps) {
            // Check if there's a NEW user message AFTER the plan finished
            // (i.e., the user has moved on to something else)
            const lastUserMsgIndex = messages.findLastIndex(m => m.role === 'user');
            const approvalIndex = i + 1; // the approval message index
            if (lastUserMsgIndex > approvalIndex) {
              return false; // User sent a new prompt after plan — plan is over
            }
            // Plan is done — keep hasActivePlan true so completion UI can show
            // (FloatingPlanProgress handles the green "Plan completed" bar)
          }

          return true;
        }
      }
    }
    return false;
  }, [messages, isLoading]);

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
          currentStep: -1, // -1 means pending, not started
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

  // Check if canvas is empty (no shapes)
  const isCanvasEmpty = shapeCount === 0;

  // Compute what the response toast should say, derived from current state.
  // useMemo ensures the text is always correct — no timing / ref issues.
  const derivedToastText = useMemo(() => {
    const lastMsg = messages[messages.length - 1];
    if (!lastMsg || lastMsg.role !== "assistant" || !lastMsg.content?.trim()) return null;

    const split = lastMsg.toolTextSplit;
    const hasToolInvocations = (lastMsg.toolInvocations?.length ?? 0) > 0;
    const hasTools = split !== undefined || hasToolInvocations;

    // During plan execution, skip ack/post-tool splitting — progress bar handles tool feedback.
    // Just show the full text content.
    if (hasActivePlan) {
      return isLoading ? null : lastMsg.content.trim() || null;
    }

    if (isLoading) {
      // Streaming: show only the ack portion (text before first tool), or all text if no tools yet
      return (split !== undefined && split > 0)
        ? lastMsg.content.slice(0, split).trim() || null
        : lastMsg.content.trim() || null;
    }

    // Done — show only the post-tool text (final summary), not the ack
    if (hasTools) {
      const ackText = (split !== undefined && split > 0)
        ? lastMsg.content.slice(0, split).trim()
        : "";

      // Get the raw post-tool text (everything after the last tool call)
      const rawPostTool = (split !== undefined && split > 0 && split < lastMsg.content.length)
        ? lastMsg.content.slice(split).trim()
        : "";

      // If there's post-tool text, show it as-is (no stripping)
      if (rawPostTool) {
        return rawPostTool;
      }

      // No post-tool text — if there's ack text only, don't re-show it when done
      return null;
    }

    // No tools — simple text reply
    return lastMsg.content.trim() || null;
  }, [isLoading, messages, hasActivePlan]);

  // Sync derivedToastText → responseToast state (state allows user-dismissal)
  useEffect(() => {
    if (isChatOpen || voice.isConnected) return;

    if (isLoading) {
      wasLoadingRef.current = true;
      if (derivedToastText) {
        shouldHideToastRef.current = false;
        setResponseToast(derivedToastText);
        setToastCentered(true);
      }
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      if (derivedToastText) {
        shouldHideToastRef.current = false;
        setResponseToast(derivedToastText);
        setToastCentered(true);
      } else {
        setResponseToast(null);
        setToastCentered(false);
      }
    }
  }, [isLoading, isChatOpen, voice.isConnected, derivedToastText]);

  // Toast stays hidden when sidebar closes via X button (user dismissed the conversation)

  // Dismiss toast when Q&A modal appears (questions provide enough context)
  useEffect(() => {
    if (pendingQuestion) {
      setResponseToast(null);
      setToastCentered(false);
    }
  }, [pendingQuestion]);

  // Update toast positioning when toolbar expands/collapses (without animation)
  // BUT don't override explicit toastCentered=true from minimize button
  useEffect(() => {
    if (responseToast && !toastCentered) {
      // Only auto-adjust if toast is in toolbar (not centered)
      // When toolbar expands, toast should hide (it's in the toolbar area)
      if (isToolbarExpanded) {
        setResponseToast(null);
      }
    }
  }, [isToolbarExpanded, responseToast, toastCentered]);

  // Creation toasts — detect creation tools when chat is minimized, one entry per tool call
  // Skip during plan execution — the progress indicator already covers it
  useEffect(() => {
    if (chatMode !== "minimized" || hasActivePlan) return;

    const latestMsg = messages[messages.length - 1];
    if (!latestMsg || latestMsg.role !== "assistant") return;

    const tools = latestMsg.toolInvocations || [];
    if (tools.length === 0) return;

    const CREATION_TOOL_NAMES = [
      "createCanvas", "createLayout", "createFrame",
      "createSticky", "createShape", "createText",
      "createDocument", "createDataTable", "createSticker", "createTaskCard",
      "createZone",
    ];
    const creationTools = tools.filter((t: { toolName: string }) =>
      CREATION_TOOL_NAMES.includes(t.toolName)
    );
    if (creationTools.length === 0) return;

    const toastKey = `${latestMsg.id}:${creationTools.length}:${isLoading}`;
    if (toastKey === lastCreationToastedRef.current) return;
    lastCreationToastedRef.current = toastKey;

    // Build one toast entry per creation tool call
    const entries: CreationToastInfo[] = [];
    // Track loose items to combine them into one line
    const looseItems: string[] = [];

    for (const tool of creationTools) {
      const args = tool.args as Record<string, unknown>;
      switch (tool.toolName) {
        case "createCanvas": {
          const resultTool = tools.find((t: { toolName: string }) => t.toolName === "createCanvas_result");
          const resultArgs = resultTool?.args as { canvasId?: string } | undefined;
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.name as string) || "board",
            type: "board",
            isCreating: isLoading,
            canvasId: resultArgs?.canvasId,
          });
          break;
        }
        case "createLayout":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.frameName as string) || "frame",
            type: "frame",
            isCreating: isLoading,
            frameName: (args.frameName as string) || "",
          });
          break;
        case "createFrame":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.name as string) || "frame",
            type: "frame",
            isCreating: isLoading,
            frameName: (args.name as string) || "",
          });
          break;
        case "createDocument":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.title as string) || "document",
            type: "document",
            isCreating: isLoading,
          });
          break;
        case "createDataTable":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.title as string) || "table",
            type: "table",
            isCreating: isLoading,
          });
          break;
        case "createSticker":
          looseItems.push("stickers");
          break;
        case "createTaskCard":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.title as string) || "task",
            type: "task",
            isCreating: isLoading,
          });
          break;
        case "createZone":
          entries.push({
            id: `${latestMsg.id}:${tool.toolName}:${entries.length}`,
            name: (args.title as string) || "zone",
            type: "frame",
            isCreating: isLoading,
            frameName: (args.title as string) || "",
          });
          break;
        case "createSticky":
          looseItems.push("sticky notes");
          break;
        case "createShape":
          looseItems.push("shapes");
          break;
        case "createText":
          looseItems.push("text");
          break;
      }
    }

    // Combine loose items into a single line
    if (looseItems.length > 0) {
      const uniqueItems = [...new Set(looseItems)];
      entries.push({
        id: `${latestMsg.id}:loose:${uniqueItems.join(",")}`,
        name: uniqueItems.join(", "),
        type: "items",
        isCreating: isLoading,
      });
    }

    setCreationToasts(entries);
  }, [messages, chatMode, isLoading, hasActivePlan]);

  // Clear creation toasts when chat opens
  useEffect(() => {
    if (chatMode !== "minimized") {
      setCreationToasts([]);
      lastCreationToastedRef.current = null;
    }
  }, [chatMode]);

  // Simple flags for what floating UI to show (only one at a time, in priority order)
  // Priority: question > plan approval > thinking > progress indicator
  // Voice and text both use the same messages-based pendingQuestion
  const showFloatingQuestion = !isChatOpen && !!pendingQuestion && !isLoading;
  // Plan only shows after loading completes (so thinking can show while processing)
  const showFloatingPlan = !isChatOpen && !!pendingPlan && !pendingQuestion && !isLoading && !dismissedPlan;
  // Thinking shows when loading BUT NOT during plan execution (progress indicator handles that)
  const showFloatingThinking = !isChatOpen && isLoading && !hasActivePlan;
  const showFloatingProgress = chatMode === "minimized" && hasActivePlan && !showFloatingQuestion && !showFloatingPlan && !showFloatingThinking && !isCompletionDismissed;

  // Thinking status text (extracted from IIFE so AnimatePresence gets a clean value)
  const thinkingStatus = useMemo(() => {
    if (!showFloatingThinking) return null;
    const lastMsg = messages[messages.length - 1];
    if (lastMsg?.role === 'assistant' && lastMsg.content && lastMsg.content.trim()) {
      return null; // Content is streaming, don't show thinking
    }
    const recentTools = lastMsg?.role === 'assistant' ? lastMsg.toolInvocations || [] : [];
    const lastSearchTool = [...recentTools].reverse().find(t => t.toolName === 'webSearch');
    return lastSearchTool ? "Searching the web..." : "Thinking...";
  }, [showFloatingThinking, messages]);

  // Lock toolbar in canvas-tools mode during entire Q&A/plan flow
  // Enter flow when question/plan appears, exit when plan execution starts or flow ends
  useEffect(() => {
    if (showFloatingQuestion || showFloatingPlan) {
      setIsInQAFlow(true);
    } else if (hasActivePlan || (!isLoading && !showFloatingQuestion && !showFloatingPlan)) {
      setIsInQAFlow(false);
    }
  }, [showFloatingQuestion, showFloatingPlan, isLoading, hasActivePlan]);

  // Clear toast when plan execution starts (but not if plan approval is still showing, and not after completion)
  useEffect(() => {
    if (hasActivePlan && !showFloatingPlan && isLoading) {
      setResponseToast(null);
      setToastCentered(false);
    }
  }, [hasActivePlan, showFloatingPlan, isLoading]);

  // Reset dismissedPlan when a new plan arrives OR when sidebar opens
  useEffect(() => {
    if (pendingPlan) {
      setDismissedPlan(false);
    }
  }, [pendingPlan]);

  // Reset dismissedPlan when sidebar opens (so minimize will show plan again)
  useEffect(() => {
    if (isChatOpen) {
      setDismissedPlan(false);
    }
  }, [isChatOpen]);

  // Listen for shape:focus custom events from expand buttons
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as FocusedShape | undefined;
      if (!detail) return;

      // All types (document, datatable, taskcard) use FocusModeOverlay
      if (detail.shapeType === "document" && detail.docId) {
        setFocusedDocId(detail.docId);
      }
      setFocusedShape(detail);
    };
    window.addEventListener("shape:focus", handler);
    return () => window.removeEventListener("shape:focus", handler);
  }, []);

  // Listen for approve-trigger events from ApproveButton shapes
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as { shapeId: string; prompt: string } | undefined;
      if (!detail?.prompt) return;
      append({ role: "user", content: detail.prompt });
    };
    window.addEventListener("shape:approve-trigger", handler);
    return () => window.removeEventListener("shape:approve-trigger", handler);
  }, [append]);


  // Toolbar always visible - prompt input hides itself when sidebar is open
  const showToolbar = true;

  return (
    <div className="h-full w-full flex overflow-hidden relative">
      {/* Main canvas area - hidden in fullscreen chat */}
      <div
        className="relative flex-1"
        style={{
          visibility: isFullscreenChat ? 'hidden' : 'visible',
          pointerEvents: isFullscreenChat ? 'none' : 'auto'
        }}
      >
        <Tldraw store={storeWithStatus} shapeUtils={customShapeUtils} components={tldrawComponents} onMount={handleMount} hideUi licenseKey="tldraw-2026-05-29/WyJUSDZHa19hTSIsWyIqIl0sMTYsIjIwMjYtMDUtMjkiXQ.x1OZFc02qzrd9Y3dHgJtRiMOOU/vh1CX0Bg0zy7LeOwe+/52qJLI9TITddUgkcFbohe+B4hOs06eVcfT4L3ADw
"/>

        {/* Canvas comments overlay */}
        <CanvasComments
          editor={editor}
          isCommentMode={isCommentMode}
          onExitCommentMode={() => setIsCommentMode(false)}
        />

        {/* Loading overlay while LiveBlocks store is connecting */}
        {storeWithStatus.status === "loading" && (
          <div className="absolute inset-0 z-[600] flex items-center justify-center bg-white/80">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Syncing canvas...</p>
            </div>
          </div>
        )}

        {/* Starting prompt cards - only when canvas is empty */}
        <StartingPromptCards
          onSelectPrompt={(text) => {
            handleSubmit(text, { openPanel: false });
          }}
          hideForSuggestions={areSuggestionsVisible}
          isCanvasEmpty={isCanvasEmpty}
          isChatOpen={isChatOpen}
          isAIEngaged={showFloatingThinking || showFloatingQuestion || showFloatingPlan || hasActivePlan || messages.length > 0}
          hasToolbarText={hasToolbarText}
          isVoiceActive={voice.isConnected}
        />

        {/* Floating masthead bar (Miro-style) */}
        <CanvasMasthead />

        {/* Floating progress indicator - shown when plan active and no other floating UI */}
        <AnimatePresence>
          {showFloatingProgress && !isPlusMenuOpen && !voice.isConnected && editor && (
            <motion.div
              key="floating-progress"
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={floatingCardVariants}
              transition={floatingTransition}
            >
              <FloatingProgressIndicator
                messages={messages}
                isLoading={isLoading}
                onOpenPanel={() => {
                  setChatMode("sidepanel");
                  setIsCompletionDismissed(true);
                }}
                onSubmit={handleSubmit}
                editor={editor}
                hasToast={!!responseToast}
                isCompletionDismissed={isCompletionDismissed}
                setIsCompletionDismissed={setIsCompletionDismissed}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Focus mode overlay (documents, data tables, task cards) */}
        <AnimatePresence>
          {focusedShape && (
            <FocusModeOverlay
              key="focus-mode"
              shape={focusedShape}
              editor={editor}
              onClose={() => {
                setFocusedDocId(null);
                setFocusedShape(null);
              }}
            />
          )}
        </AnimatePresence>


        {/* Floating UI wrapper */}
        <div className="absolute inset-0 z-[60] pointer-events-none" onWheel={(e) => e.stopPropagation()} style={{ visibility: focusedShape ? "hidden" : "visible" }}>
          {/* Floating question card */}
          <AnimatePresence>
            {!isChatOpen && pendingQuestion && !isLoading && (
              <motion.div
                key={`question-${currentQuestionIndex}`}
                className="pointer-events-auto absolute bottom-24 left-1/2 w-[520px]"
                style={{ x: "-50%" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={floatingTransition}
              >
                <FloatingQuestionCard
                  question={pendingQuestion.question}
                  options={pendingQuestion.suggestions}
                  onSelect={(answer) => {
                    const newAnswers = [...questionAnswers, answer];
                    if (pendingQuestions && currentQuestionIndex < pendingQuestions.length - 1) {
                      setQuestionAnswers(newAnswers);
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      const combined = newAnswers.join("\n");
                      handleSubmit(combined, { openPanel: false });
                      setQuestionAnswers([]);
                      setCurrentQuestionIndex(0);
                    }
                  }}
                  onSkip={() => {
                    const newAnswers = [...questionAnswers, "Skip"];
                    if (pendingQuestions && currentQuestionIndex < pendingQuestions.length - 1) {
                      setQuestionAnswers(newAnswers);
                      setCurrentQuestionIndex(prev => prev + 1);
                    } else {
                      const combined = newAnswers.join("\n");
                      handleSubmit(combined, { openPanel: false });
                      setQuestionAnswers([]);
                      setCurrentQuestionIndex(0);
                    }
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating plan approval toast */}
          <AnimatePresence>
            {!isChatOpen && pendingPlan && !pendingQuestion && !isLoading && !dismissedPlan && (
              <motion.div
                key="plan-approval"
                className="pointer-events-auto absolute bottom-28 left-1/2 w-[420px]"
                style={{ x: "-50%" }}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ ...floatingTransition, delay: 0.15 }}
              >
                <FloatingPlanApproval
                  title={pendingPlan.title}
                  onApprove={() => handleSubmit("Approved! Go ahead.", { openPanel: false })}
                  onViewDetails={() => {
                    setChatMode("sidepanel");
                    setIsCompletionDismissed(true);
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Floating thinking indicator - hide once content starts streaming */}
          <AnimatePresence>
            {thinkingStatus && (
              <motion.div
                key="thinking"
                className="absolute bottom-24 left-1/2"
                style={{ x: "-50%" }}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={floatingTransition}
              >
                <FloatingThinkingIndicator status={thinkingStatus} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stacked toasts — response text + creation status lines */}
          <AnimatePresence>
            {!showFloatingQuestion && !isChatOpen && !shouldHideToastRef.current && !areSuggestionsVisible && !isPlusMenuOpen && !voice.isConnected && (
              (toastCentered && responseToast)
            ) && (
              <motion.div
                key="toast-stack"
                className={`absolute z-[65] w-[420px] transition-[bottom] duration-200 ${showFloatingPlan || showFloatingProgress ? 'bottom-[188px]' : isToolbarMultiLine ? 'bottom-40' : 'bottom-24'}`}
                style={{ left: '50%' }}
                initial={{ ...toastVariants.hidden, x: "-50%" }}
                animate={{ ...toastVariants.visible, x: "-50%" }}
                exit={{ ...toastVariants.exit, x: "-50%" }}
                transition={floatingTransition}
              >
                <div className="flex flex-col gap-2">
                  {/* Response toast card (ack during streaming, final reply when done) */}
                  {toastCentered && responseToast && (
                    <div className="pointer-events-auto w-full bg-white shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[300px] relative" style={{ borderRadius: 24 }}>
                      <div className="absolute top-4 left-4 z-10">
                        <div className="w-6 h-6 rounded-full bg-slate-400 flex items-center justify-center">
                          <svg width="14" height="14" viewBox="0 0 105 105" fill="none">
                            <ellipse cx="20" cy="50" rx="16" ry="32" fill="white" />
                            <ellipse cx="50" cy="50" rx="16" ry="48" fill="white" />
                            <ellipse cx="80" cy="50" rx="16" ry="44" fill="white" />
                          </svg>
                        </div>
                      </div>
                      <div className="absolute top-4 right-4 z-10">
                        <div
                          onClick={() => { setResponseToast(null); setToastCentered(false); }}
                          className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-full cursor-pointer"
                          title="Dismiss"
                        >
                          <IconCross css={{ width: 14, height: 14 }} />
                        </div>
                      </div>
                      <div
                        onClick={() => {
                          setResponseToast(null);
                          setToastCentered(false);
                          setChatMode("sidepanel");
                          setIsCompletionDismissed(true);
                        }}
                        className="overflow-y-auto p-4 pl-14 pr-10 hover:bg-gray-50 transition-colors cursor-pointer"
                      >
                        <div className="text-sm text-gray-700">
                          <Markdown
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                              em: ({ children }) => <em className="italic">{children}</em>,
                              ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                              li: ({ children }) => <li className="mb-0.5">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-semibold mt-3 mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-base font-semibold mt-3 mb-2">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-semibold mt-3 mb-2">{children}</h3>,
                              code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                            }}
                          >
                            {responseToast}
                          </Markdown>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Thinking indicator — shows while AI is working on the board */}
                  {isLoading && (
                    <div className="pointer-events-auto flex items-center gap-2.5 px-5 py-3 bg-white shadow-lg border border-gray-200" style={{ borderRadius: 24 }}>
                      <div className="w-5 h-5 flex-shrink-0 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
                      <span className="text-sm text-gray-500">Updating the board...</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Toolbar - animates down/up when entering/exiting fullscreen */}
      <AnimatePresence>
        {!isFullscreenChat && !focusedShape && showToolbar && (
          <motion.div
            key="toolbar"
            className="absolute top-0 left-0 right-0 h-full z-50 pointer-events-none [&>*]:pointer-events-auto"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 40 }}
            transition={smoothTransition}
          >
            <Toolbar
              editor={editor}
              onToggleChat={() => setChatMode(isChatOpen ? "minimized" : "sidepanel")}
              isChatOpen={isChatOpen}
              hideInput={
                // Hide input when in voice mode
                voice.isConnected
              }
              onSubmit={handleSubmit}
              isLoading={isLoading}
              voiceState={voice.state}
              onVoiceToggle={handleVoiceToggle}
              isMuted={voice.isMuted}
              onToggleMute={voice.toggleMute}
              onExpandedChange={setIsToolbarExpanded}
              onMultiLineChange={setIsToolbarMultiLine}
              responseToast={isChatOpen || toastCentered || showFloatingQuestion || shouldHideToastRef.current || areSuggestionsVisible || voice.isConnected ? null : responseToast}
              onDismissToast={() => { setResponseToast(null); setToastCentered(false); }}
              onOpenChat={() => {
                setResponseToast(null);
                setToastCentered(false);
                setChatMode("sidepanel");
                setIsCompletionDismissed(true);
              }}
              hasMessages={messages.length > 0}
              hasPendingQuestion={!!pendingQuestion}
              canvasState={getCanvasState()}
              onSuggestionsVisibilityChange={setAreSuggestionsVisible}
              onInputChange={setHasToolbarText}
              onPlusMenuChange={setIsPlusMenuOpen}
              onCreateDocument={() => {
                if (!editor) return;
                // Get the center of the current viewport
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "document",
                  x: canvasPoint.x - 390,
                  y: canvasPoint.y - 330,
                  props: {
                    docId: generateId(),
                    title: "Untitled document",
                    w: 600,
                    h: 900,
                  },
                });
                // Select the new shape
                editor.select(shapeId);
              }}
              onCreateDataTable={() => {
                if (!editor) return;
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "datatable",
                  x: canvasPoint.x - 240,
                  y: canvasPoint.y - 140,
                  props: {
                    tableId: generateId(),
                    title: "Untitled table",
                    w: 480,
                    h: 280,
                  },
                });
                editor.select(shapeId);
              }}
              onPlaceSticker={(sticker, screenPos) => {
                if (!editor) return;
                // Use drop position if provided, otherwise viewport center
                const screenPt = screenPos
                  ? { x: screenPos.x, y: screenPos.y }
                  : editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(screenPt);
                const displayW = 120;
                const displayH = (sticker.height / sticker.width) * displayW;
                const assetId = `asset:sticker-${sticker.id}` as any;
                editor.createAssets([{
                  id: assetId,
                  type: "image",
                  typeName: "asset",
                  props: {
                    name: sticker.id,
                    src: sticker.url,
                    w: sticker.width,
                    h: sticker.height,
                    mimeType: "image/png",
                    isAnimated: false,
                  },
                  meta: {},
                }]);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "image",
                  x: canvasPoint.x - displayW / 2,
                  y: canvasPoint.y - displayH / 2,
                  props: {
                    assetId,
                    w: displayW,
                    h: displayH,
                  },
                });
                editor.select(shapeId);
              }}
              onCreateTaskCard={() => {
                if (!editor) return;
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "taskcard" as any,
                  x: canvasPoint.x - 144,
                  y: canvasPoint.y - 80,
                  props: {
                    w: 288,
                    h: 160,
                    title: "Untitled task",
                    description: "",
                    status: "not_started",
                    priority: "medium",
                    assignee: "",
                    dueDate: "",
                    tags: [],
                    subtasks: [],
                  },
                  meta: { createdBy: "user" },
                });
                editor.select(shapeId);
              }}
              onCreateKanbanBoard={() => {
                if (!editor) return;
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "kanbanboard" as any,
                  x: canvasPoint.x - 400,
                  y: canvasPoint.y - 250,
                  props: {
                    w: 800,
                    h: 500,
                    title: "Kanban Board",
                    lanes: [
                      { id: "lane-todo", title: "To Do", color: "#3B82F6", statusMapping: "To Do" },
                      { id: "lane-doing", title: "Doing", color: "#F59E0B", statusMapping: "In Progress" },
                      { id: "lane-done", title: "Done", color: "#10B981", statusMapping: "Done" },
                    ],
                    cards: [
                      { id: "kb-card-1", title: "Design navigation patterns", description: "", status: "not_started", priority: "high", assignee: "Mark B", dueDate: "", tags: ["Design", "Feature"], subtasks: [] },
                      { id: "kb-card-2", title: "Set up CI pipeline", description: "", status: "not_started", priority: "medium", assignee: "", dueDate: "", tags: ["Infra"], subtasks: [] },
                    ],
                    cardsByLane: {
                      "lane-todo": ["kb-card-1", "kb-card-2"],
                      "lane-doing": [],
                      "lane-done": [],
                    },
                  },
                  meta: { createdBy: "user" },
                });
                editor.select(shapeId);
              }}
              onCreateGanttChart={() => {
                if (!editor) return;
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();

                // Generate default dates starting from today
                const today = new Date();
                const d = (offset: number) => {
                  const date = new Date(today);
                  date.setDate(date.getDate() + offset);
                  return date.toISOString();
                };

                editor.createShape({
                  id: shapeId,
                  type: "ganttchart" as any,
                  x: canvasPoint.x - 350,
                  y: canvasPoint.y - 200,
                  props: {
                    w: 700,
                    h: 400,
                    title: "Project Timeline",
                    tasks: [
                      { id: 1, text: "Planning", start: d(0), end: d(6), progress: 0, parent: 0, type: "summary", open: true },
                      { id: 2, text: "Requirements", start: d(0), end: d(2), progress: 0, parent: 1, type: "task", open: false },
                      { id: 3, text: "Design", start: d(3), end: d(5), progress: 0, parent: 1, type: "task", open: false },
                      { id: 4, text: "Implementation", start: d(7), end: d(27), progress: 0, parent: 0, type: "summary", open: true },
                      { id: 5, text: "Development", start: d(7), end: d(20), progress: 0, parent: 4, type: "task", open: false },
                    ],
                    links: [
                      { id: 1, source: 2, target: 3, type: "e2s" },
                      { id: 2, source: 3, target: 5, type: "e2s" },
                    ],
                    scales: [
                      { unit: "month", step: 1, format: "MMMM yyy" },
                      { unit: "week", step: 1, format: "w" },
                    ],
                    columns: [
                      { id: "text", header: "Task name", width: 210 },
                      { id: "start", header: "Start date", width: 106, align: "center" },
                      { id: "add-task", header: "", width: 40, align: "center" },
                    ],
                    colorScheme: "",
                  },
                  meta: { createdBy: "user" },
                });
                editor.select(shapeId);
              }}
              onCreateApproveButton={() => {
                if (!editor) return;
                const viewportCenter = editor.getViewportScreenCenter();
                const canvasPoint = editor.screenToPage(viewportCenter);
                const shapeId = createShapeId();
                editor.createShape({
                  id: shapeId,
                  type: "approvebutton" as any,
                  x: canvasPoint.x - 225,
                  y: canvasPoint.y - 139,
                  props: {
                    w: 450,
                    h: 278,
                  },
                });
                editor.select(shapeId);
              }}
              isCommentMode={isCommentMode}
              onToggleCommentMode={() => setIsCommentMode((v) => !v)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Side chat panel is now rendered by ChatShell in root layout */}
    </div>
  );
}
