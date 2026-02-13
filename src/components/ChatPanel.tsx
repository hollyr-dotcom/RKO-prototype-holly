"use client";

import type { Message } from "@/hooks/useAgent";
import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconPlus,
  IconMicrophone,
  IconArrowUp,
  IconCheckMark,
  IconChevronDown,
  IconArrowRight,
  IconMinus,
  IconArrowsOutSimple,
  IconArrowsInSimple,
  IconCross,
  IconSquarePencil,
  IconSidebarGlobalOpen,
} from "@mirohq/design-system-icons";

// Shimmer animation for loading text (Claude-style glimmer)
const shimmerStyle = {
  background: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 40%, #d1d5db 50%, #9ca3af 60%, #9ca3af 100%)",
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  animation: "shimmer 2s ease-in-out infinite",
} as React.CSSProperties;

// Voice wave icon
function VoiceWaveIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
      <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
      <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
      <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
      <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
    </svg>
  );
}

interface ChatPanelProps {
  onClose: () => void;
  onCollapse?: () => void;
  onExpand?: () => void;
  onNewChat?: () => void;
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  onNavigateToFrames?: (frameIds: string[]) => void;
  onNavigateToCanvas?: (canvasId?: string) => void;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
  isVisible?: boolean;
  planPanel?: React.ReactNode;
  isPlanPanelVisible?: boolean;
  onTogglePlanPanel?: () => void;
}

// Question block with clickable suggestions
function QuestionBlock({
  question,
  suggestions,
  onSelect,
  isLatest,
}: {
  question: string;
  suggestions: string[];
  onSelect: (answer: string) => void;
  isLatest: boolean;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm text-gray-900">{question}</p>
      {isLatest && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded-full transition-colors text-gray-700 animate-slideInFromLeft"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Task status icon for plan steps
function TaskStatusIcon({ status }: { status: 'pending' | 'running' | 'done' }) {
  switch (status) {
    case 'pending':
      return <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0" />;
    case 'running':
      return (
        <div className="w-4 h-4 flex-shrink-0 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin" />
      );
    case 'done':
      return (
        <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
          <IconCheckMark css={{ width: 10, height: 10 }} />
        </div>
      );
  }
}

// Plan block with approve/reject buttons and progress tracking
function PlanBlock({
  title,
  steps,
  onApprove,
  onReject,
  isLatest,
  currentStep,
  isExecuting,
}: {
  title: string;
  steps: string[];
  summary: string;
  onApprove: () => void;
  onReject: () => void;
  isLatest: boolean;
  currentStep?: number;
  isExecuting?: boolean;
}) {
  const hasStarted = currentStep !== undefined;

  const getStepStatus = (index: number): 'pending' | 'running' | 'done' => {
    if (currentStep === undefined) return 'pending';
    if (isExecuting) {
      if (index < currentStep) return 'done';
      if (index === currentStep) return 'running';
      return 'pending';
    } else {
      if (index <= currentStep) return 'done';
      return 'pending';
    }
  };

  const completedSteps = currentStep !== undefined ? (isExecuting ? currentStep : currentStep + 1) : 0;

  return (
    <div className="border border-gray-200 p-4" style={{ borderRadius: '24px' }}>
      {/* Header */}
      <div className="mb-3">
        <p className="text-sm font-semibold text-gray-900">Plan</p>
        <p className="text-xs text-gray-500">{hasStarted ? `${completedSteps} of ${steps.length}` : 'Awaiting approval'}</p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, i) => {
          const status = getStepStatus(i);
          return (
            <div key={i} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 flex-shrink-0">
                <TaskStatusIcon status={status} />
              </div>
              <span className={status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}>
                {step}
              </span>
            </div>
          );
        })}
      </div>

      {/* Approve/Reject buttons */}
      {isLatest && !hasStarted && (
        <div className="flex gap-2 mt-4">
          <button
            onClick={onReject}
            className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Modify
          </button>
          <button
            onClick={onApprove}
            className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            Approve & Start
          </button>
        </div>
      )}
    </div>
  );
}

// Compact progress header - shows at top of panel during execution
function TaskProgressHeader({
  title,
  steps,
  currentStep,
  isExecuting,
  isFullscreen = false,
}: {
  title: string;
  steps: string[];
  currentStep: number;
  isExecuting: boolean;
  isFullscreen?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Count completed steps
  const completedSteps = isExecuting ? currentStep : currentStep + 1;
  const progress = steps.length > 0 ? (completedSteps / steps.length) * 100 : 0;
  const isComplete = completedSteps >= steps.length;

  // Get current/next step text
  // When executing: show current step being worked on
  // When paused: show next step to be done
  const nextStepIndex = isExecuting ? currentStep : currentStep + 1;
  const currentStepText = steps[nextStepIndex] || steps[steps.length - 1];

  return (
    <div className="border-b border-gray-200 bg-gray-50 overflow-hidden">
      {/* Collapsed header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-3 flex items-center justify-between cursor-pointer"
      >
        {/* Title and step count */}
        <div className="flex items-center gap-2">
          {!isExpanded && (
            <div className="relative w-4 h-4 flex-shrink-0">
              <svg className={`w-4 h-4 ${isExecuting ? 'animate-spin' : '-rotate-90'}`} viewBox="0 0 36 36">
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="3"
                />
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={isComplete ? "#22c55e" : "#3b82f6"}
                  strokeWidth="3"
                  strokeDasharray={isExecuting ? "25, 100" : `${progress}, 100`}
                  className="transition-all duration-300"
                />
              </svg>
            </div>
          )}
          <p className="text-xs font-medium text-gray-900">Plan</p>
          {!isExpanded && !isFullscreen && (
            <span className="text-xs text-gray-400">{completedSteps}/{steps.length}</span>
          )}
        </div>

        {/* Expand icon - positioned to align with X button icon */}
        <div className={`pr-1.5 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}>
          <IconChevronDown css={{ width: 16, height: 16 }} />
        </div>
      </button>

      {/* Expanded steps list */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            className="pl-6 pr-4 bg-gray-50 overflow-hidden"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{
              height: { type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.2 },
              opacity: { type: "tween", ease: [0.25, 0.1, 0.25, 1.0], duration: 0.15 }
            }}
          >
            <div className="pb-3">
              {steps.map((step, i) => {
                const isDone = i < completedSteps;
                const isRunning = i === currentStep && isExecuting;
                return (
                  <div key={i} className="flex gap-2 py-1.5 text-xs items-center">
                    <div>
                      <TaskStatusIcon status={isDone ? 'done' : isRunning ? 'running' : 'pending'} />
                    </div>
                    <span className={`${isDone ? 'text-gray-400 line-through' : isRunning ? 'text-blue-700' : 'text-gray-600'}`}>
                      {i + 1}. {step}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Thinking status block
function ThinkingBlock({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </span>
      <span>{status}</span>
    </div>
  );
}

// Progress status block - shows what AI is working on
function ProgressBlock({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
      <span className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
      </span>
      <span className="text-sm text-gray-700">{status}</span>
    </div>
  );
}

// Web search block removed - merged into activity indicator

// Progressive artifact card — loading states while streaming, clickable when done
function ArtifactCard({
  toolInvocations,
  isStreaming = false,
  onNavigateToCanvas,
  onNavigateToFrames,
}: {
  toolInvocations: Message["toolInvocations"];
  isStreaming?: boolean;
  onNavigateToCanvas?: (canvasId?: string) => void;
  onNavigateToFrames?: (frameNames: string[]) => void;
}) {
  if (!toolInvocations || toolInvocations.length === 0) return null;

  const createCanvasTool = toolInvocations.find(t => t.toolName === "createCanvas");
  const createCanvasResult = toolInvocations.find(t => t.toolName === "createCanvas_result");
  const layoutTools = toolInvocations.filter(t => t.toolName === "createLayout");
  const frameTools = toolInvocations.filter(t => t.toolName === "createFrame");
  const looseItems = toolInvocations.filter(t =>
    ["createSticky", "createShape", "createText"].includes(t.toolName)
  );

  const hasBoard = !!createCanvasTool;
  const boardReady = !!createCanvasResult;
  const resultArgs = createCanvasResult?.args as { canvasId?: string; spaceId?: string } | undefined;
  const canvasId = resultArgs?.canvasId;
  const boardName = (createCanvasTool?.args as { name?: string })?.name || "New Board";

  // Build content lines with per-line completion tracking
  // Tools arrive sequentially from the SDK — if tool N+1 has arrived, tool N is done.
  type ContentLine = { label: string; loadingLabel: string; onClick?: () => void; toolIndex: number };
  const contentLines: ContentLine[] = [];

  // Track original indices in toolInvocations for per-line completion
  const indexedInvocations = toolInvocations.map((t, i) => ({ ...t, index: i }));
  const lastToolIndex = toolInvocations.length - 1;

  const indexedLayouts = indexedInvocations.filter(t => t.toolName === "createLayout");
  const indexedFrames = indexedInvocations.filter(t => t.toolName === "createFrame");
  const indexedLoose = indexedInvocations.filter(t =>
    ["createSticky", "createShape", "createText"].includes(t.toolName)
  );

  indexedLayouts.forEach(lt => {
    const args = lt.args as { frameName?: string; items?: Array<{ type?: string }>; type?: string };
    const count = args.items?.length || 0;
    if (count === 0) return;
    const itemType = args.items?.[0]?.type || "item";
    const plural = count !== 1;
    const typeLabel = itemType === "sticky"
      ? `sticky note${plural ? "s" : ""}`
      : `${itemType}${plural ? "s" : ""}`;
    contentLines.push({
      label: args.frameName ? `Added ${count} ${typeLabel} to ${args.frameName}` : `Added ${count} ${typeLabel}`,
      loadingLabel: `Adding ${count} ${typeLabel}${args.frameName ? ` to ${args.frameName}` : ""}...`,
      onClick: args.frameName ? () => onNavigateToFrames?.([args.frameName!]) : undefined,
      toolIndex: lt.index,
    });
  });

  indexedFrames.forEach(ft => {
    const args = ft.args as { name?: string };
    contentLines.push({
      label: `Created frame "${args.name || "Untitled"}"`,
      loadingLabel: `Creating frame "${args.name || "Untitled"}"...`,
      onClick: args.name ? () => onNavigateToFrames?.([args.name!]) : undefined,
      toolIndex: ft.index,
    });
  });

  const indexedDocuments = indexedInvocations.filter(t => t.toolName === "createDocument");
  indexedDocuments.forEach(dt => {
    const title = (dt.args as { title?: string }).title || "Untitled document";
    contentLines.push({
      label: `Created document "${title}"`,
      loadingLabel: `Creating document "${title}"...`,
      toolIndex: dt.index,
    });
  });

  const indexedTables = indexedInvocations.filter(t => t.toolName === "createDataTable");
  indexedTables.forEach(tt => {
    const title = (tt.args as { title?: string }).title || "Untitled table";
    contentLines.push({
      label: `Created table "${title}"`,
      loadingLabel: `Creating table "${title}"...`,
      toolIndex: tt.index,
    });
  });

  if (indexedLoose.length > 0 && indexedLayouts.length === 0) {
    const counts: Record<string, number> = {};
    let maxIndex = 0;
    indexedLoose.forEach(t => {
      const name = t.toolName.replace("create", "").toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
      maxIndex = Math.max(maxIndex, t.index);
    });
    Object.entries(counts).forEach(([name, count]) => {
      const plural = count !== 1;
      const typeLabel = name === "sticky"
        ? `sticky note${plural ? "s" : ""}`
        : `${name}${plural ? "s" : ""}`;
      contentLines.push({
        label: `Added ${count} ${typeLabel}`,
        loadingLabel: `Adding ${count} ${typeLabel}...`,
        toolIndex: maxIndex,
      });
    });
  }

  if (!hasBoard && contentLines.length === 0) return null;

  const allDone = !isStreaming;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Board row */}
      {hasBoard && (() => {
        const showName = boardReady || allDone;
        const isClickable = showName && allDone;
        return (
          <button
            onClick={() => isClickable && onNavigateToCanvas?.(canvasId)}
            disabled={!isClickable}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              isClickable ? "hover:bg-gray-50 cursor-pointer group" : "cursor-default"
            }`}
          >
            {showName && (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-400">
                <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1.25" fill="currentColor" />
                <rect x="8" y="0.5" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.5" />
                <rect x="0.5" y="8" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.5" />
                <rect x="8" y="8" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.3" />
              </svg>
            )}
            <span
              className={`text-sm flex-1 truncate ${showName ? "font-medium text-gray-900" : ""}`}
              style={showName ? undefined : shimmerStyle}
            >
              {showName ? `Created ${boardName}` : `Creating ${boardName}...`}
            </span>
            {isClickable && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <IconArrowRight css={{ width: 12, height: 12, color: "#9ca3af" }} />
              </span>
            )}
          </button>
        );
      })()}

      {/* Nested content lines with tree connectors */}
      {contentLines.map((line, i) => {
        const isLastLine = i === contentLines.length - 1;
        // A line is done if: stream ended, OR a later tool has arrived (sequential execution)
        const lineDone = allDone || line.toolIndex < lastToolIndex;
        const isClickable = lineDone && !!(line.onClick || onNavigateToCanvas);
        return (
          <button
            key={i}
            onClick={() => {
              if (!isClickable) return;
              if (line.onClick) line.onClick();
              else if (onNavigateToCanvas) onNavigateToCanvas(canvasId);
            }}
            disabled={!isClickable}
            className={`w-full flex items-center text-left transition-colors border-t border-gray-100 ${
              isClickable ? "hover:bg-gray-50 cursor-pointer group" : "cursor-default"
            }`}
          >
            {/* Tree connector when nested under a board */}
            {hasBoard && (
              <span className="text-gray-300 pl-3 text-sm select-none w-7 flex-shrink-0 font-mono">
                {isLastLine ? "\u2514" : "\u251C"}
              </span>
            )}
            <div className={`flex items-center gap-2 py-2 flex-1 min-w-0 ${hasBoard ? "pr-3" : "px-3"}`}>
              <span
                className={`text-sm flex-1 truncate ${lineDone ? "text-gray-600" : ""}`}
                style={lineDone ? undefined : shimmerStyle}
              >
                {lineDone ? line.label : line.loadingLabel}
              </span>
              {isClickable && (
                <span className="opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <IconArrowRight css={{ width: 12, height: 12, color: "#9ca3af" }} />
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}


// Feedback request block - shows as checkpoint during execution
function FeedbackBlock({
  message,
  onSelect,
  isLatest,
}: {
  message: string;
  suggestions?: string[]; // Not used - simplified to Continue/Modify
  onSelect: (answer: string) => void;
  isLatest: boolean;
}) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 text-white">
          <IconCheckMark css={{ width: 12, height: 12 }} />
        </div>
        <span className="text-sm font-medium text-blue-900">Checkpoint</span>
      </div>
      <p className="text-sm text-blue-800 mb-3">{message}</p>
      {isLatest && (
        <div className="flex gap-2">
          <button
            onClick={() => onSelect("Continue")}
            className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
          <button
            onClick={() => onSelect("I'd like to make some adjustments")}
            className="flex-1 px-3 py-2 text-sm bg-white border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors"
          >
            Modify
          </button>
        </div>
      )}
    </div>
  );
}

// Checkpoint block - pauses for user feedback during execution
function CheckpointBlock({
  completed,
  onSelect,
  onNavigate,
  isLatest,
}: {
  completed: string;
  onSelect: (option: string) => void;
  onNavigate?: () => void;
  isLatest: boolean;
}) {
  const [collapsed, setCollapsed] = useState(false);

  const handleSelect = (option: string) => {
    setCollapsed(true);
    onSelect(option);
  };

  // Collapsed state - simple text
  if (collapsed || !isLatest) {
    return (
      <p className="text-sm text-gray-500">✓ Checkpoint</p>
    );
  }

  // Expanded state
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Checkpoint</p>
      <button
        onClick={onNavigate}
        className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600 transition-colors group mb-3 text-left"
      >
        <span>{completed}</span>
        <IconArrowRight css={{ width: 16, height: 16, color: '#9ca3af', flexShrink: 0 }} />
      </button>
      <div className="flex gap-2">
        <button
          onClick={() => handleSelect("Continue")}
          className="px-3 py-1.5 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Continue
        </button>
        <button
          onClick={() => handleSelect("I'd like to make some changes")}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
        >
          Make Changes
        </button>
      </div>
    </div>
  );
}

// Completed block - shown when all plan steps are done
function CompletedBlock({
  options,
  onSelect,
  isLatest,
}: {
  summary: string;
  options: string[];
  onSelect: (option: string) => void;
  isLatest: boolean;
}) {
  // Only show for the last message
  if (!isLatest) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mt-2">
      <p className="text-sm font-medium text-green-700 mb-3">Task completed!</p>
      {options.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {options.map((option, i) => (
            <button
              key={i}
              onClick={() => onSelect(option)}
              className="px-3 py-1.5 text-sm bg-white border border-green-200 rounded-lg text-green-700 hover:bg-green-100 transition-colors"
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}


export function ChatPanel({
  onClose,
  onCollapse,
  onExpand,
  onNewChat,
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
  onNavigateToFrames,
  onNavigateToCanvas,
  isFullscreen = false,
  onExitFullscreen,
  isVisible = true,
  planPanel,
  isPlanPanelVisible = true,
  onTogglePlanPanel,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [lastAskUserId, setLastAskUserId] = useState<string | null>(null);

  // Reset only when a genuinely NEW askUser message appears (not on every message change)
  useEffect(() => {
    const latestAskUser = messages.findLast(m => m.toolInvocations?.some(t => t.toolName === 'askUser'));
    if (latestAskUser && latestAskUser.id !== lastAskUserId) {
      setLastAskUserId(latestAskUser.id);
      setCurrentQuestionIndex(0);
      setQuestionAnswers([]);
    }
  }, [messages, lastAskUserId]);

  // Auto-scroll to bottom when messages change or loading state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  // Auto-focus input when panel becomes visible
  useEffect(() => {
    if (!isVisible) return;
    // Small delay to ensure panel animation completes
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isVisible]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    onSubmit(input);
    setInput("");
  };

  // Extract active plan from messages for the header
  const activePlan = (() => {
    // Find the most recent confirmPlan tool call
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;
      const planToolIndex = msg.toolInvocations?.findIndex(t => t.toolName === 'confirmPlan');
      if (planToolIndex === undefined || planToolIndex === -1) continue;

      const planTool = msg.toolInvocations![planToolIndex];
      const args = planTool.args as { title: string; steps: string[]; summary: string };

      // Check for canvas tools in THIS message (after confirmPlan)
      const toolsAfterPlan = msg.toolInvocations!.slice(planToolIndex + 1);
      const hasCanvasToolsInSameMsg = toolsAfterPlan.some(t =>
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable'].includes(t.toolName)
      );

      // Check for activity in LATER messages
      const laterMessages = messages.slice(i + 1).filter(m => m.role === 'assistant');
      const laterToolCalls = laterMessages.flatMap(m => m.toolInvocations || []);

      // Combine all tool calls
      const allToolCalls = [...toolsAfterPlan, ...laterToolCalls];
      const progressCalls = allToolCalls.filter(t => t.toolName === 'showProgress');

      // Check for user approval
      const nextUserMsg = messages.slice(i + 1).find(m => m.role === 'user');
      const userApproved = nextUserMsg?.content?.toLowerCase().includes('approve');
      const hasProgressCalls = progressCalls.length > 0;
      const hasCanvasTools = hasCanvasToolsInSameMsg || laterToolCalls.some(t =>
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable'].includes(t.toolName)
      );
      const hasCheckpoint = allToolCalls.some(t => t.toolName === 'checkpoint');

      const executionStarted = userApproved || hasProgressCalls || hasCanvasTools || hasCheckpoint;

      if (!executionStarted) return null; // Only show header when executing

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
        isExecuting: isLoading,
      };
    }
    return null;
  })();

  return (
    <div className="w-full h-full bg-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-900">Chat</span>
          <span className="text-xs text-gray-500">with AI</span>
        </div>
        <div className="flex items-center gap-1">
          {onNewChat && (
            <button
              onClick={onNewChat}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="New chat"
            >
              <IconSquarePencil css={{ width: 18, height: 18 }} />
            </button>
          )}
          {isFullscreen && onExitFullscreen && (
            <button
              onClick={onExitFullscreen}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Collapse to side panel"
            >
              <IconArrowsInSimple css={{ width: 18, height: 18 }} />
            </button>
          )}
          {!isFullscreen && onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Minimize to toast"
            >
              <IconMinus css={{ width: 18, height: 18 }} />
            </button>
          )}
          {!isFullscreen && onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Fullscreen chat"
            >
              <IconArrowsOutSimple css={{ width: 18, height: 18 }} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Close"
          >
            <IconCross css={{ width: 18, height: 18 }} />
          </button>
        </div>
      </div>

      {/* Content area: chat + plan side by side, below header */}
      <div className="flex flex-1 min-h-0">
        {/* Chat column */}
        <div className="flex-1 flex flex-col min-w-0">

      {/* Task progress header - shows when plan is executing (hidden in fullscreen) */}
      {activePlan && !isFullscreen && (
        <TaskProgressHeader
          title={activePlan.title}
          steps={activePlan.steps}
          currentStep={activePlan.currentStep}
          isExecuting={activePlan.isExecuting}
          isFullscreen={isFullscreen}
        />
      )}

      {/* Messages */}
      <div className={`flex-1 overflow-y-auto p-4 space-y-4 ${isFullscreen ? 'mx-auto w-full max-w-3xl' : ''}`}>
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm mt-8">
            <p className="mb-2">Ask me anything</p>
            <p className="text-xs text-gray-400">
              I can help you create, organize, and brainstorm on the canvas
            </p>
          </div>
        ) : (
          messages.map((message, index) => {
            // Check if this message has special tool calls
            const askUserTool = message.toolInvocations?.find(
              (t) => t.toolName === "askUser"
            );
            const confirmPlanTool = message.toolInvocations?.find(
              (t) => t.toolName === "confirmPlan"
            );
            const showThinkingTool = message.toolInvocations?.find(
              (t) => t.toolName === "showThinking"
            );
            const requestFeedbackTool = message.toolInvocations?.find(
              (t) => t.toolName === "requestFeedback"
            );
            const checkpointTool = message.toolInvocations?.find(
              (t) => t.toolName === "checkpoint"
            );
            // Get the LAST showProgress call (most recent update)
            const showProgressTools = message.toolInvocations?.filter(
              (t) => t.toolName === "showProgress"
            );
            const showProgressTool = showProgressTools && showProgressTools.length > 0
              ? showProgressTools[showProgressTools.length - 1]
              : undefined;
            // Get web search calls
            const webSearchTools = message.toolInvocations?.filter(
              (t) => t.toolName === "webSearch"
            );
            const isLatestMessage = index === messages.length - 1;

            return (
              <div
                key={message.id}
                className={`${
                  message.role === "user" ? "flex justify-end" : ""
                }`}
              >
                {message.role === "user" ? (() => {
                  // Hide the combined answer message that follows an askUser tool
                  const prevMsg = index > 0 ? messages[index - 1] : null;
                  const isAskUserResponse = prevMsg?.role === 'assistant' && prevMsg?.toolInvocations?.some(t => t.toolName === 'askUser');
                  if (isAskUserResponse) return null;

                  return (
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  );
                })() : (
                  /* AI message: full width, no bg */
                  <div className="w-full">
                    {/* Text + artifact cards — split at tool boundary for correct ordering */}
                    {(() => {
                      const hasText = message.content && !askUserTool && !message.content.trim().startsWith('{');
                      const hasArtifactTools = message.toolInvocations?.some(t =>
                        ["createCanvas", "createLayout", "createFrame", "createSticky", "createShape", "createText", "createDocument", "createDataTable"].includes(t.toolName)
                      );

                      const mdComponents = {
                        p: ({ children }: { children?: React.ReactNode }) => <p className="mb-2 last:mb-0">{children}</p>,
                        strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold">{children}</strong>,
                        em: ({ children }: { children?: React.ReactNode }) => <em className="italic">{children}</em>,
                        ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                        ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                        li: ({ children }: { children?: React.ReactNode }) => <li className="mb-0.5">{children}</li>,
                        code: ({ children }: { children?: React.ReactNode }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                      };
                      const clean = (s: string) => s.replace(/\n?---\n?/g, '\n').trim();

                      // Split text at tool boundary: acknowledgment → cards → summary
                      const split = message.toolTextSplit;
                      // split=0 means tools came first, all text is "after tools" → goes below cards
                      // split>0 means there's text before AND after tools
                      // split undefined or >= content.length means no tools or all text before tools
                      const allTextAfterTools = hasArtifactTools && split === 0;
                      const hasRealSplit = hasArtifactTools && split !== undefined && split > 0 && split < message.content.length;
                      const ackText = hasRealSplit ? clean(message.content.slice(0, split)) : (allTextAfterTools ? "" : (hasText ? clean(message.content) : ""));
                      const rawSummary = hasRealSplit ? clean(message.content.slice(split)) : (allTextAfterTools && hasText ? clean(message.content) : "");
                      // Suppress summary if AI repeated its ack text after tools
                      const summaryText = (rawSummary && ackText && rawSummary.startsWith(ackText)) ? rawSummary.slice(ackText.length).trim() : rawSummary;

                      return (
                        <>
                          {/* Acknowledgment text (before tools) */}
                          {ackText && (
                            <div className="text-sm text-gray-900">
                              <Markdown components={mdComponents}>{ackText}</Markdown>
                            </div>
                          )}

                          {/* Artifact card — progressive during streaming, clickable when done */}
                          {hasArtifactTools && (
                            <div className={ackText ? "mt-2" : ""}>
                              <ArtifactCard
                                toolInvocations={message.toolInvocations}
                                isStreaming={isLatestMessage && isLoading}
                                onNavigateToCanvas={onNavigateToCanvas}
                                onNavigateToFrames={onNavigateToFrames}
                              />
                            </div>
                          )}

                          {/* Summary text (after tools) */}
                          {summaryText && (
                            <div className="mt-2 text-sm text-gray-900">
                              <Markdown components={mdComponents}>{summaryText}</Markdown>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* askUser tool - render as sequential Q&A conversation */}
                    {askUserTool && (() => {
                      const args = askUserTool.args as { questions?: Array<{ question: string; suggestions: string[] }>; question?: string; suggestions?: string[] };
                      const questions = args.questions || (args.question ? [{ question: args.question, suggestions: args.suggestions || [] }] : []);

                      // Check if user already submitted all answers
                      const nextUserMsg = messages.slice(index + 1).find(m => m.role === 'user');

                      if (nextUserMsg) {
                        // All answered -show static Q&A parsed from the submitted message
                        const answers = (nextUserMsg.content || '').split('\n');
                        return (
                          <div className={message.content ? "mt-3" : ""}>
                            {questions.map((q, qi) => (
                              <div key={qi} className={qi > 0 ? "mt-4" : ""}>
                                <p className="text-sm text-gray-900 mb-2">{q.question}</p>
                                {answers[qi] && (
                                  <div className="flex justify-end mb-2">
                                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
                                      <p className="text-sm">{answers[qi]}</p>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        );
                      }

                      // Active Q&A -show questions one at a time
                      return (
                        <div className={message.content ? "mt-3" : ""}>
                          {questions.map((q, qi) => {
                            const hasAnswer = questionAnswers[qi] !== undefined;

                            // Don't show questions we haven't reached yet
                            if (qi > currentQuestionIndex) return null;

                            return (
                              <div key={qi} className={qi > 0 ? "mt-4" : ""}>
                                {hasAnswer ? (
                                  <>
                                    {/* Answered -static question text + answer bubble */}
                                    <p className="text-sm text-gray-900 mb-2">{q.question}</p>
                                    <div className="flex justify-end mb-2">
                                      <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
                                        <p className="text-sm">{questionAnswers[qi]}</p>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  /* Current unanswered -QuestionBlock renders question text internally */
                                  <QuestionBlock
                                    question={q.question}
                                    suggestions={q.suggestions}
                                    onSelect={(answer) => {
                                      const newAnswers = [...questionAnswers, answer];
                                      setQuestionAnswers(newAnswers);
                                      if (qi < questions.length - 1) {
                                        setCurrentQuestionIndex(prev => prev + 1);
                                      } else {
                                        // Last question -submit all answers
                                        onSubmit(newAnswers.join("\n"));
                                      }
                                    }}
                                    isLatest={isLatestMessage && !isLoading}
                                  />
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* confirmPlan tool - shows plan with progress tracking */}
                    {confirmPlanTool && !askUserTool && (!isLatestMessage || !isLoading) && (() => {
                      const planArgs = confirmPlanTool.args as { title: string; steps: string[]; summary: string };

                      // Check for canvas tools in THIS message (after confirmPlan)
                      const thisMessageTools = message.toolInvocations || [];
                      const confirmPlanIndex = thisMessageTools.findIndex(t => t.toolName === 'confirmPlan');
                      const toolsAfterPlan = thisMessageTools.slice(confirmPlanIndex + 1);
                      const hasCanvasToolsInSameMsg = toolsAfterPlan.some(t =>
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable'].includes(t.toolName)
                      );

                      // Check for activity in LATER messages
                      const laterMessages = messages.slice(index + 1).filter(m => m.role === 'assistant');
                      const laterToolCalls = laterMessages.flatMap(m => m.toolInvocations || []);

                      // Check if user approved
                      const nextUserMsg = messages.slice(index + 1).find(m => m.role === 'user');
                      const userApproved = nextUserMsg?.content?.toLowerCase().includes('approve');

                      // Combine all tool calls for progress tracking
                      const allToolCalls = [...toolsAfterPlan, ...laterToolCalls];
                      const progressCalls = allToolCalls.filter(t => t.toolName === 'showProgress');

                      const hasProgressCalls = progressCalls.length > 0;
                      const hasCanvasTools = hasCanvasToolsInSameMsg || laterToolCalls.some(t =>
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable'].includes(t.toolName)
                      );
                      const hasCheckpoint = allToolCalls.some(t => t.toolName === 'checkpoint');

                      const executionStarted = userApproved || hasProgressCalls || hasCanvasTools || hasCheckpoint;

                      // Calculate current step from progress calls
                      let completedSteps = 0;
                      let currentRunningStep: number | undefined;
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

                      const currentStep = executionStarted ? (
                        isLoading && currentRunningStep !== undefined
                          ? currentRunningStep - 1
                          : completedSteps > 0 ? completedSteps - 1 : 0
                      ) : undefined;

                      // Hide inline plan block once execution starts (shown in header instead)
                      if (executionStarted) return null;

                      // In fullscreen: only show approve/reject buttons (steps are in sidebar)
                      if (isFullscreen) {
                        if (!isLatestMessage) return null;
                        return (
                          <div className={message.content ? "mt-3" : ""}>
                            <div className="flex gap-2">
                              <button
                                onClick={() => onSubmit("I'd like to make some changes.")}
                                className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Modify
                              </button>
                              <button
                                onClick={() => onSubmit("Approved! Go ahead.")}
                                className="flex-1 px-3 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                              >
                                Approve & Start
                              </button>
                            </div>
                          </div>
                        );
                      }

                      return (
                        <div className={message.content ? "mt-3" : ""}>
                          <PlanBlock
                            title={planArgs.title}
                            steps={planArgs.steps}
                            summary={planArgs.summary}
                            onApprove={() => onSubmit("Approved! Go ahead.")}
                            onReject={() => onSubmit("I'd like to make some changes.")}
                            isLatest={isLatestMessage && !isLoading}
                            currentStep={currentStep}
                            isExecuting={executionStarted && isLoading}
                          />
                        </div>
                      );
                    })()}

                    {/* requestFeedback tool - render as feedback request with suggestions */}
                    {requestFeedbackTool && (
                      <div className={message.content || askUserTool || confirmPlanTool ? "mt-3" : ""}>
                        <FeedbackBlock
                          message={(requestFeedbackTool.args as { message: string }).message}
                          suggestions={(requestFeedbackTool.args as { suggestions: string[] }).suggestions}
                          onSelect={(answer) => onSubmit(answer)}
                          isLatest={isLatestMessage && !isLoading}
                        />
                      </div>
                    )}

                    {/* checkpoint tool - show CompletedBlock if plan is done, otherwise CheckpointBlock */}
                    {checkpointTool && (() => {
                      const checkpointArgs = checkpointTool.args as { completed: string; options?: string[] };

                      // Check if plan is complete (activePlan exists and all steps done)
                      const isPlanComplete = activePlan && !activePlan.isExecuting &&
                        (activePlan.currentStep >= activePlan.steps.length - 1);

                      // Extract frame names from this batch — scan backwards from checkpoint
                      // until we hit a previous checkpoint or plan approval
                      const frameNames: string[] = [];
                      for (let mi = index; mi >= 0; mi--) {
                        const m = messages[mi];
                        // Stop at previous checkpoint (but not this one)
                        if (mi < index && m.toolInvocations?.some(t => t.toolName === 'checkpoint')) break;
                        // Stop at user approval message
                        if (m.role === 'user' && (m.content?.toLowerCase().includes('approve') || m.content === 'Continue')) break;
                        m.toolInvocations?.forEach(t => {
                          if (t.toolName === "createLayout") {
                            const args = t.args as { frameName?: string };
                            if (args.frameName) frameNames.push(args.frameName);
                          }
                          if (t.toolName === "createFrame") {
                            const args = t.args as { name?: string };
                            if (args.name) frameNames.push(args.name);
                          }
                        });
                      }

                      const handleNavigate = () => {
                        if (onNavigateToFrames && frameNames.length > 0) {
                          onNavigateToFrames(frameNames);
                        }
                      };

                      return (
                        <div className={message.content || askUserTool || confirmPlanTool ? "mt-3" : ""}>
                          {isPlanComplete ? (
                            <CompletedBlock
                              summary={checkpointArgs.completed}
                              options={checkpointArgs.options || ["Make refinements", "Start something new"]}
                              onSelect={(option) => onSubmit(option)}
                              isLatest={isLatestMessage && !isLoading}
                            />
                          ) : (
                            <CheckpointBlock
                              completed={checkpointArgs.completed}
                              onSelect={(option) => onSubmit(option)}
                              onNavigate={handleNavigate}
                              isLatest={isLatestMessage && !isLoading}
                            />
                          )}
                        </div>
                      );
                    })()}

                  </div>
                )}
              </div>
            );
          })
        )}

{/* Single unified activity indicator - only show when NO header is visible */}
        {isLoading && messages.length > 0 && !activePlan && (
          (() => {
            const lastMsg = messages[messages.length - 1];
            const recentTools = lastMsg.role === "assistant" ? lastMsg.toolInvocations || [] : [];

            // Skip when artifact tools present — the ArtifactCard serves as the activity indicator
            const hasArtifactTools = recentTools.some(t =>
              ["createCanvas", "createLayout", "createFrame", "createSticky", "createShape", "createText", "createDocument", "createDataTable"].includes(t.toolName)
            );
            if (hasArtifactTools) return null;

            // Check for various tool types
            const lastSearchTool = [...recentTools].reverse().find(t => t.toolName === "webSearch");
            const lastCanvasTool = [...recentTools].reverse().find(t =>
              ["createSticky", "createShape", "createText", "createFrame", "createArrow", "createWorkingNote", "createDocument", "createDataTable"].includes(t.toolName)
            );
            const confirmPlanTool = [...recentTools].reverse().find(t => t.toolName === "confirmPlan");

            // Generate activity message based on what's happening
            const getActivityMessage = () => {
              // Plan being created
              if (confirmPlanTool) {
                return "Creating plan...";
              }
              // Web search takes priority
              if (lastSearchTool) {
                return "Searching the web...";
              }
              // Canvas tools - show what's being created
              if (lastCanvasTool) {
                switch (lastCanvasTool.toolName) {
                  case "createFrame": return `Creating "${(lastCanvasTool.args as {name?: string}).name || "frame"}"...`;
                  case "createSticky": {
                    const text = (lastCanvasTool.args as {text?: string}).text || "";
                    return `Adding "${text.slice(0, 25)}${text.length > 25 ? '...' : ''}"`;
                  }
                  case "createShape": return `Creating ${(lastCanvasTool.args as {type?: string}).type || "shape"}...`;
                  case "createText": {
                    const text = (lastCanvasTool.args as {text?: string}).text || "";
                    return `Adding "${text.slice(0, 25)}${text.length > 25 ? '...' : ''}"`;
                  }
                  case "createArrow": return "Connecting...";
                  case "createDocument": return `Creating document "${(lastCanvasTool.args as {title?: string}).title || "document"}"...`;
                  case "createDataTable": return `Creating table "${(lastCanvasTool.args as {title?: string}).title || "table"}"...`;
                  default: return "Working...";
                }
              }
              return "Thinking...";
            };

            // Count canvas items being created
            const canvasItemCount = recentTools.filter(t =>
              ["createSticky", "createShape", "createText", "createFrame", "createArrow", "createDocument", "createDataTable"].includes(t.toolName)
            ).length;

            return (
              <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
                </span>
                <span className="text-sm text-gray-600">{getActivityMessage()}</span>
                {canvasItemCount > 1 && (
                  <span className="text-xs text-gray-400">({canvasItemCount} items)</span>
                )}
              </div>
            );
          })()
        )}

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating progress indicator - removed (was dead code) */}

      {/* Input */}
      <form onSubmit={handleSubmit} className={`relative p-4 ${isFullscreen ? 'mx-auto w-full max-w-3xl' : ''}`}>
        <div className="flex items-center bg-gray-100 rounded-full">
          {/* Plus button */}
          <button
            type="button"
            className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0 flex items-center justify-center"
            title="Add"
          >
            <IconPlus size="medium" />
          </button>

          {/* Input */}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter reply..."
            disabled={isLoading}
            className="flex-1 py-3 text-base bg-transparent border-0 outline-none placeholder:text-gray-400 disabled:opacity-50 min-w-0"
          />

          {/* Mic button */}
          <button
            type="button"
            className="p-3 text-black hover:text-black transition-colors duration-200 flex-shrink-0 flex items-center justify-center"
            title="Voice input"
          >
            <IconMicrophone size="medium" />
          </button>

          {/* Voice mode / Submit button */}
          {input.trim() ? (
            <button
              type="submit"
              className="w-10 h-10 m-1 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
              title="Send"
            >
              <IconArrowUp size="medium" />
            </button>
          ) : (
            <button
              type="button"
              className="w-10 h-10 m-1 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800 flex-shrink-0"
              title="Voice mode"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <rect x="2" y="9" width="2.5" height="6" rx="1.25" />
                <rect x="6.5" y="5" width="2.5" height="14" rx="1.25" />
                <rect x="11" y="3" width="2.5" height="18" rx="1.25" />
                <rect x="15.5" y="5" width="2.5" height="14" rx="1.25" />
                <rect x="20" y="9" width="2.5" height="6" rx="1.25" />
              </svg>
            </button>
          )}
        </div>
      </form>

        </div>{/* end chat column */}

        {/* Plan panel — animates width, content right-aligned so it clips from left */}
        <div
          className="flex-shrink-0 overflow-hidden relative"
          style={{
            width: planPanel ? (isPlanPanelVisible ? 320 : 46) : 0,
            transition: "width 0.25s cubic-bezier(0.25, 0.1, 0.25, 1)",
          }}
        >
          {/* Plan content — pinned to the right so collapsing clips from the left */}
          {planPanel && (
            <div
              className="absolute top-0 right-0 bottom-0 bg-gray-50"
              style={{
                width: 320,
                borderLeft: "1px solid #e5e7eb",
                opacity: isPlanPanelVisible ? 1 : 0,
                transition: "opacity 0.15s ease",
                pointerEvents: isPlanPanelVisible ? "auto" : "none",
              }}
            >
              {planPanel}
            </div>
          )}

          {/* Toggle button — always in same position: top-right of the wrapper */}
          {planPanel && onTogglePlanPanel && (
            <button
              onClick={onTogglePlanPanel}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title={isPlanPanelVisible ? "Hide plan" : "Show plan"}
            >
              <IconSidebarGlobalOpen css={{
                width: 18,
                height: 18,
                transform: isPlanPanelVisible ? 'none' : 'rotate(180deg)',
                transition: 'transform 0.25s ease',
              }} />
            </button>
          )}
        </div>

      </div>{/* end content area */}
    </div>
  );
}
