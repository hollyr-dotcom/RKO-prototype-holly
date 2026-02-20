"use client";

import type { Message } from "@/hooks/useAgent";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Lottie from "lottie-react";
import type { LottieRefCurrentProps } from "lottie-react";
import aiThinkingAnimation from "./toolbar/lottie/ai-thinking.json";
import Markdown from "react-markdown";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCheckMark,
  IconChevronDown,
  IconArrowRight,
  IconMinus,
  IconArrowsOutSimple,
  IconArrowsInSimple,
  IconCross,
  IconSquarePencil,
  IconSidebarGlobalOpen,
  IconSidebarGlobalClosed,
} from "@mirohq/design-system-icons";
import { ChatInput } from "./toolbar/ChatInput";
import { VoiceStopButton } from "./toolbar/VoiceStopButton";
import { FloatingQuestionCard } from "./FloatingQuestionCard";

// Shimmer animation for loading text (Claude-style glimmer)
const shimmerStyle = {
  background: "linear-gradient(90deg, #9ca3af 0%, #9ca3af 40%, #d1d5db 50%, #9ca3af 60%, #9ca3af 100%)",
  backgroundSize: "200% 100%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  backgroundClip: "text",
  animation: "shimmer 2s ease-in-out infinite",
} as React.CSSProperties;

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
  voiceState?: "idle" | "connecting" | "listening" | "speaking" | "error";
  onVoiceToggle?: () => void;
  canvasState?: { frames: any[]; orphans: any[]; arrows: any[] };
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
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
    <div className="space-y-5">
      <p className="text-sm text-gray-900">{question}</p>
      {isLatest && (
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, i) => (
            <button
              key={i}
              onClick={() => onSelect(suggestion)}
              className="px-4 py-2 text-sm border border-gray-200 hover:bg-gray-50 rounded-full transition-colors text-gray-500 animate-slideInFromLeft"
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

// Lottie thinking animation with intro → loop → outro phases
// Frames: 0-30 intro, 30-75 loop, 75-105 outro
function ThinkingLottie({ size = 24, gray = false }: { size?: number; gray?: boolean }) {
  const lottieRef = useRef<LottieRefCurrentProps>(null);
  const phaseRef = useRef<"intro" | "loop">("intro");

  // Play intro on mount, then loop
  useEffect(() => {
    const anim = lottieRef.current;
    if (!anim) return;
    phaseRef.current = "intro";
    anim.goToAndPlay(0, true);
  }, []);

  const handleFrame = useCallback(() => {
    const anim = lottieRef.current;
    if (!anim) return;
    const frame = anim.animationItem?.currentFrame ?? 0;

    if (phaseRef.current === "intro" && frame >= 29) {
      phaseRef.current = "loop";
      anim.goToAndPlay(30, true);
    } else if (phaseRef.current === "loop" && frame >= 74) {
      anim.goToAndPlay(30, true);
    }
  }, []);

  return (
    <div style={{ width: size, height: size, flexShrink: 0 }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={aiThinkingAnimation}
        autoplay={true}
        loop={false}
        onEnterFrame={handleFrame}
        style={{ width: size, height: size }}
      />
    </div>
  );
}

// Thinking status block
function ThinkingBlock({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      <ThinkingLottie size={20} />
      <span>{status}</span>
    </div>
  );
}

// Progress status block - shows what AI is working on
function ProgressBlock({ status }: { status: string }) {
  return (
    <div className="flex items-center gap-2 py-2 px-3 bg-gray-50 rounded-lg">
      <ThinkingLottie size={20} />
      <span className="text-sm text-gray-700">{status}</span>
    </div>
  );
}

// Web search block removed - merged into activity indicator

// Service icons for connector cycling (14x14, slate-400 fill)
const serviceIcons: Record<string, React.ReactNode> = {
  jira: <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M21.202 2H12c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C18.85 10.13 20.708 12 23 12V2.803A.803.803 0 0021.202 2z" fill="currentColor"/><path d="M16.202 7H7c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C13.85 15.13 15.708 17 18 17V7.803A.803.803 0 0016.202 7z" fill="currentColor"/><path d="M11.202 12H2c0 1.107.437 2.169 1.217 2.954a5.16 5.16 0 003.937 1.224h1.695v1.646C8.85 20.13 10.708 22 13 22v-9.197A.803.803 0 0011.202 12z" fill="currentColor"/></svg>,
  github: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.009-.866-.013-1.7-2.782.603-3.369-1.342-3.369-1.342-.454-1.155-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/></svg>,
  linear: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3.357 14.1a9.969 9.969 0 01-.354-2.197L12.9 21.8c-.745-.046-1.485-.17-2.197-.354L3.357 14.1zm-1.005 2.09l5.458 5.458A9.985 9.985 0 013.32 19.68a9.985 9.985 0 01-1.968-3.49zm2.553-6.67a10.016 10.016 0 011.31-2.76L14.24 14.785a10.016 10.016 0 01-2.76 1.31L4.905 9.52zm2.19-3.72A9.96 9.96 0 0112 3.003a9.998 9.998 0 019.997 9.998 9.96 9.96 0 01-2.798 4.905L7.095 5.8z"/></svg>,
  looker: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="3"/><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm0 18a8 8 0 110-16 8 8 0 010 16z"/></svg>,
  amplitude: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 19h20L12 2zm0 4l7 11H5l7-11z"/></svg>,
  salesforce: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 8.5c-.8 0-1.5.3-2.1.7-.5-.9-1.5-1.5-2.6-1.5-.5 0-1 .1-1.4.4-.5-.8-1.4-1.3-2.4-1.3-1.6 0-2.9 1.3-2.9 2.9 0 .2 0 .3.1.5C4.9 10.5 4 11.5 4 12.8c0 1.5 1.2 2.7 2.7 2.7h10.6c1.5 0 2.7-1.2 2.7-2.7 0-1.3-1-2.4-2.2-2.7.1-.5-.3-1.6-.3-1.6z"/></svg>,
  gainsight: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15l-4-4 1.41-1.41L11 14.17l6.59-6.59L19 9l-8 8z"/></svg>,
  gong: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>,
  "miro-insights": <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M15 2a3 3 0 013 3v1.618l2.105.371a3 3 0 012.434 3.476l-1.736 9.849a3 3 0 01-3.476 2.433L7.48 21.01A3 3 0 015.001 18 3 3 0 012 15V5a3 3 0 013-3h10zm3 13a3 3 0 01-3 3H7.003a1 1 0 00.824 1.041l9.848 1.736a1 1 0 001.158-.811l1.736-9.848a1 1 0 00-.81-1.159L18 8.649V15zM5 4a1 1 0 00-1 1v10a1 1 0 001 1h10a1 1 0 001-1V5a1 1 0 00-1-1H5z"/></svg>,
  confluence: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M2.7 17.2c-.2.3-.4.7-.6 1-.2.4-.1.8.3 1l3.4 2c.4.2.8.1 1-.3.2-.3.4-.7.6-1 1.7-3 3.6-3.4 7-1.6l3.3 1.7c.4.2.8.1 1-.3l2-3.4c.2-.4.1-.8-.3-1l-3.3-1.7c-5.7-3-8.7-2.4-14.4 3.6z"/><path d="M21.3 6.8c.2-.3.4-.7.6-1 .2-.4.1-.8-.3-1l-3.4-2c-.4-.2-.8-.1-1 .3-.2.3-.4.7-.6 1-1.7 3-3.6 3.4-7 1.6L6.3 4c-.4-.2-.8-.1-1 .3l-2 3.4c-.2.4-.1.8.3 1l3.3 1.7c5.7 3 8.7 2.4 14.4-3.6z"/></svg>,
  slack: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M6 15a2 2 0 01-2 2 2 2 0 01-2-2 2 2 0 012-2h2v2zm1 0a2 2 0 012-2 2 2 0 012 2v5a2 2 0 01-2 2 2 2 0 01-2-2v-5zm2-8a2 2 0 01-2-2 2 2 0 012-2 2 2 0 012 2v2H9zm0 1a2 2 0 012 2 2 2 0 01-2 2H4a2 2 0 01-2-2 2 2 0 012-2h5zm8 2a2 2 0 012-2 2 2 0 012 2 2 2 0 01-2 2h-2v-2zm-1 0a2 2 0 01-2 2 2 2 0 01-2-2V5a2 2 0 012-2 2 2 0 012 2v5zm-2 8a2 2 0 012 2 2 2 0 01-2 2 2 2 0 01-2-2v-2h2zm0-1a2 2 0 01-2-2 2 2 0 012-2h5a2 2 0 012 2 2 2 0 01-2 2h-5z"/></svg>,
  figma: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8.5 2h3v6h-3a3 3 0 010-6zm0 6h3v6h-3a3 3 0 010-6zm0 6h3v3a3 3 0 11-3-3zm7-12a3 3 0 110 6h-3V2h3zm-3.5 9a3 3 0 116 0 3 3 0 01-6 0z"/></svg>,
  notion: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M4.5 3.5l9-1.5c.8-.1 1.9.1 2.3.4l3.2 2.3c.3.2.4.4.4.7V20c0 .6-.4 1.1-1 1.2l-9.5 1.5c-.6.1-1.2 0-1.6-.4l-2.8-3.3c-.4-.5-.5-.7-.5-1.2V4.5c0-.5.3-.9.8-1h.7z"/></svg>,
  asana: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path fillRule="evenodd" d="M17.65 12.62a4.35 4.35 0 100 8.7 4.35 4.35 0 000-8.7zm-11.3 0a4.35 4.35 0 100 8.7 4.35 4.35 0 000-8.7zM16.35 7.183a4.35 4.35 0 11-8.7 0 4.35 4.35 0 018.7 0z"/></svg>,
  productboard: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><rect x="3" y="3" width="8" height="8" rx="1.5"/><rect x="13" y="3" width="8" height="8" rx="1.5" opacity=".5"/><rect x="3" y="13" width="8" height="8" rx="1.5" opacity=".5"/></svg>,
  datadog: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 100 20 10 10 0 000-20zm-1.5 5.5a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zM8 13a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4 4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3zm4-4.5a1.5 1.5 0 110-3 1.5 1.5 0 010 3z"/></svg>,
  "google-docs": <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM8 13h8v1.5H8V13zm0 3h8v1.5H8V16zm0-6h3v1.5H8V10z"/></svg>,
  "google-sheets": <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM7 13h4v2H7v-2zm0 3h4v2H7v-2zm6-3h4v2h-4v-2zm0 3h4v2h-4v-2z"/></svg>,
  "google-calendar": <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H5V8h14v11z"/></svg>,
  workday: <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="8" r="4"/><path d="M12 14c-4 0-8 2-8 4v2h16v-2c0-2-4-4-8-4z"/></svg>,
  "stripe-benchmarks": <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M3 3v18h18V3H3zm16 16H5V5h14v14zM7 13h2v4H7v-4zm4-4h2v8h-2V9zm4 2h2v6h-2v-6z"/></svg>,
};

// Connector cycling animation — shows "Connecting to X..." cycling through services
function ConnectorCycler({ services }: { services: string[] }) {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    if (services.length <= 1) return;
    const id = setInterval(() => setIdx(i => (i + 1) % services.length), 3000);
    return () => clearInterval(id);
  }, [services.length]);

  // Map service short names to display names
  const displayNames: Record<string, string> = {
    jira: "Jira", github: "GitHub", linear: "Linear", looker: "Looker",
    amplitude: "Amplitude", productboard: "Productboard", salesforce: "Salesforce",
    gainsight: "Gainsight", gong: "Gong", "miro-insights": "Miro Insights",
    "stripe-benchmarks": "Stripe", "google-docs": "Google Docs", confluence: "Confluence",
    notion: "Notion", slack: "Slack", figma: "Figma", "google-calendar": "Google Calendar",
    datadog: "Datadog", "google-sheets": "Google Sheets", workday: "Workday", asana: "Asana",
  };
  const key = services[idx];
  const name = displayNames[key] || key;
  const icon = serviceIcons[key];
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon && <span className="inline-flex text-slate-400">{icon}</span>}
      Connecting to {name}...
    </span>
  );
}

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
  type ContentLine = { label: string; loadingLabel: string | React.ReactNode; onClick?: () => void; toolIndex: number };
  const contentLines: ContentLine[] = [];

  // Track original indices in toolInvocations for per-line completion
  const indexedInvocations = toolInvocations.map((t, i) => ({ ...t, index: i }));
  const lastToolIndex = toolInvocations.length - 1;

  // Pair webSearch calls with the next canvas tool that follows them
  const canvasToolNames = ["createSources", "createLayout", "createFrame", "createDocument", "createDataTable", "createZone"];
  const pairedToolIndices = new Set<number>();
  const webSearchInvocations = indexedInvocations.filter(t => t.toolName === "webSearch");

  webSearchInvocations.forEach(ws => {
    // Look ahead from this webSearch to find the next canvas tool (before another webSearch)
    let pairedTool: typeof indexedInvocations[0] | null = null;
    for (let j = ws.index + 1; j < indexedInvocations.length; j++) {
      const candidate = indexedInvocations[j];
      if (candidate.toolName === "webSearch") break; // hit another search, stop
      if (canvasToolNames.includes(candidate.toolName)) {
        pairedTool = candidate;
        break;
      }
    }

    if (pairedTool) {
      pairedToolIndices.add(pairedTool.index);
      // Build the "done" label from the paired canvas tool
      const pArgs = pairedTool.args as Record<string, unknown>;
      const doneLabel = pairedTool.toolName === "createSources"
        ? `Added sources for "${(pArgs.title as string) || "research"}"`
        : pairedTool.toolName === "createFrame"
        ? `Created frame "${(pArgs.name as string) || "Untitled"}"`
        : pairedTool.toolName === "createLayout"
        ? `Added items to "${(pArgs.frameName as string) || "frame"}"`
        : pairedTool.toolName === "createDocument"
        ? `Created document "${(pArgs.title as string) || "Untitled"}"`
        : `Created table "${(pArgs.title as string) || "Untitled"}"`;
      const wsArgs = ws.args as { purpose?: string; query?: string };
      const purpose = wsArgs.purpose || wsArgs.query || "the web";
      contentLines.push({
        label: doneLabel,
        loadingLabel: `Researching ${purpose}...`,
        onClick: (() => {
          const name = (pArgs.name as string) || (pArgs.title as string);
          if (name) return () => onNavigateToFrames?.([name]);
          return undefined;
        })(),
        toolIndex: pairedTool.index, // stays loading until paired tool arrives
      });
    } else {
      // Unpaired webSearch — no canvas tool follows yet
      const wsArgs = ws.args as { purpose?: string; query?: string };
      const purpose = wsArgs.purpose || wsArgs.query || "the web";
      contentLines.push({
        label: `Researched ${purpose}`,
        loadingLabel: `Researching ${purpose}...`,
        toolIndex: ws.index,
      });
    }
  });

  // queryConnectors — handled by the activity indicator (Lottie animation), not the card

  const indexedLayouts = indexedInvocations.filter(t => t.toolName === "createLayout");
  const indexedFrames = indexedInvocations.filter(t => t.toolName === "createFrame");
  const indexedLoose = indexedInvocations.filter(t =>
    ["createSticky", "createShape", "createText"].includes(t.toolName)
  );

  indexedLayouts.forEach(lt => {
    if (pairedToolIndices.has(lt.index)) return;
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
    if (pairedToolIndices.has(ft.index)) return;
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
    if (pairedToolIndices.has(dt.index)) return;
    const title = (dt.args as { title?: string }).title || "Untitled document";
    contentLines.push({
      label: `Created document "${title}"`,
      loadingLabel: `Creating document "${title}"...`,
      onClick: () => onNavigateToFrames?.([title]),
      toolIndex: dt.index,
    });
  });

  const indexedTables = indexedInvocations.filter(t => t.toolName === "createDataTable");
  indexedTables.forEach(tt => {
    if (pairedToolIndices.has(tt.index)) return;
    const title = (tt.args as { title?: string }).title || "Untitled table";
    contentLines.push({
      label: `Created table "${title}"`,
      loadingLabel: `Creating table "${title}"...`,
      onClick: () => onNavigateToFrames?.([title]),
      toolIndex: tt.index,
    });
  });

  // Zones (createZone)
  const indexedZones = indexedInvocations.filter(t => t.toolName === "createZone");
  indexedZones.forEach(zt => {
    if (pairedToolIndices.has(zt.index)) return;
    const title = (zt.args as { title?: string }).title || "Untitled zone";
    contentLines.push({
      label: `Created zone "${title}"`,
      loadingLabel: `Creating zone "${title}"...`,
      onClick: () => onNavigateToFrames?.([title]),
      toolIndex: zt.index,
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

  // Standalone createSources (no preceding webSearch)
  const indexedSources = indexedInvocations.filter(t => t.toolName === "createSources");
  indexedSources.forEach(st => {
    if (pairedToolIndices.has(st.index)) return;
    const title = (st.args as { title?: string }).title || "sources";
    contentLines.push({
      label: `Added sources for "${title}"`,
      loadingLabel: `Adding sources for "${title}"...`,
      onClick: () => onNavigateToFrames?.([title]),
      toolIndex: st.index,
    });
  });

  // Sort all lines by execution order
  contentLines.sort((a, b) => a.toolIndex - b.toolIndex);

  const allDone = !isStreaming;

  // During streaming, hide the last content line UNLESS a later tool exists
  // in toolInvocations (meaning its result was dispatched or another tool arrived).
  // This prevents duplication with the activity indicator while still showing
  // zones as "done" once their staggered result is dispatched.
  const visibleLines = isStreaming
    ? contentLines.filter((line, i) => {
        if (i < contentLines.length - 1) return true; // not the last → always show
        // Last line: show if any tool exists after it in toolInvocations
        return line.toolIndex < lastToolIndex;
      })
    : contentLines;

  // Board is visible once result arrives or stream ends
  const showBoard = hasBoard && (boardReady || allDone);

  // Hide card entirely if nothing to show yet
  if (!showBoard && visibleLines.length === 0) return null;

  return (
    <div className="rounded-xl border border-gray-200 overflow-hidden">
      {/* Board row */}
      {showBoard && (() => {
        const isClickable = allDone;
        return (
          <button
            onClick={() => isClickable && onNavigateToCanvas?.(canvasId)}
            disabled={!isClickable}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors ${
              isClickable ? "hover:bg-gray-50 cursor-pointer group" : "cursor-default"
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="flex-shrink-0 text-gray-400">
              <rect x="0.5" y="0.5" width="5.5" height="5.5" rx="1.25" fill="currentColor" />
              <rect x="8" y="0.5" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.5" />
              <rect x="0.5" y="8" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.5" />
              <rect x="8" y="8" width="5.5" height="5.5" rx="1.25" fill="currentColor" opacity="0.3" />
            </svg>
            <span className="text-sm flex-1 truncate font-medium text-gray-900">
              Created {boardName}
            </span>
            {isClickable && (
              <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                <IconArrowRight css={{ width: 12, height: 12, color: "#9ca3af" }} />
              </span>
            )}
          </button>
        );
      })()}

      {/* Completed content lines — items appear here once done */}
      {visibleLines.map((line, i) => {
        const isLastLine = i === visibleLines.length - 1;
        const isClickable = !!(line.onClick || onNavigateToCanvas);
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
            {showBoard && (
              <span className="text-gray-300 pl-3 text-sm select-none w-7 flex-shrink-0 font-mono">
                {isLastLine && allDone ? "\u2514" : "\u251C"}
              </span>
            )}
            <div className={`flex items-center gap-2 py-2 flex-1 min-w-0 ${showBoard ? "pr-3" : "px-3"}`}>
              <span className="text-sm flex-1 truncate text-gray-600">
                {line.label}
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
  voiceState = "idle",
  onVoiceToggle,
  canvasState = { frames: [], orphans: [], arrows: [] },
  onToggleSidebar,
  isSidebarCollapsed = true,
}: ChatPanelProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
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

  const isVoiceActive = voiceState !== "idle";

  // ── Activity indicator state ──
  const [activityStart, setActivityStart] = useState(0);
  const [, setActivityTick] = useState(0);

  // Track last zone dispatch — indicator lingers for 1.5s after zone appears
  const lastZoneRef = useRef<{ title: string; resultCount: number; timestamp: number } | null>(null);

  // Connector sources — exact same list and order as Canvas.tsx toast
  const connectorSourcesRef = useRef([
    { name: "Jira", key: "jira" },
    { name: "Miro Insights", key: "miro-insights" },
    { name: "Salesforce", key: "salesforce" },
    { name: "Asana", key: "asana" },
    { name: "Google Drive", key: "google-docs" },
    { name: "Looker", key: "looker" },
    { name: "Amplitude", key: "amplitude" },
    { name: "GitHub", key: "github" },
  ]);

  // Start connector timer when plan execution begins
  useEffect(() => {
    const lastMsg = messages[messages.length - 1];
    const tools = lastMsg?.role === "assistant" ? lastMsg.toolInvocations || [] : [];
    const hasPlanExecution = tools.some(t => t.toolName === "showProgress");
    if (isLoading && hasPlanExecution && activityStart === 0) {
      setActivityStart(Date.now());
    }
    if (!isLoading) {
      setActivityStart(0);
      lastZoneRef.current = null;
    }
  }, [isLoading, messages, activityStart]);

  // Tick every 500ms for indicator updates (connector cycling + zone linger)
  useEffect(() => {
    if (activityStart === 0) return;
    const id = setInterval(() => {
      if (Date.now() - activityStart < 21000) {
        setActivityTick(t => t + 1);
      } else {
        clearInterval(id);
      }
    }, 500);
    return () => clearInterval(id);
  }, [activityStart]);

  // Extract the latest unanswered askUser question for the fullscreen modal
  const activeQuestion = useMemo(() => {
    if (!isFullscreen) return null;
    const latestAskUser = messages.findLast(m =>
      m.toolInvocations?.some(t => t.toolName === 'askUser')
    );
    if (!latestAskUser) return null;

    // Check if already answered (a user message follows the askUser)
    const askIdx = messages.indexOf(latestAskUser);
    const nextUserMsg = messages.slice(askIdx + 1).find(m => m.role === 'user');
    if (nextUserMsg) return null;

    const tool = latestAskUser.toolInvocations!.find(t => t.toolName === 'askUser')!;
    const args = tool.args as { questions?: Array<{question: string; suggestions: string[]}>; question?: string; suggestions?: string[] };
    const questions = args.questions || (args.question ? [{ question: args.question, suggestions: args.suggestions || [] }] : []);
    const currentQ = questions[currentQuestionIndex];
    if (!currentQ) return null;

    // Don't show modal if this question already has an answer in progress
    if (questionAnswers[currentQuestionIndex] !== undefined) return null;

    return {
      question: currentQ.question,
      suggestions: currentQ.suggestions,
      questionIndex: currentQuestionIndex,
      totalQuestions: questions.length,
      questions,
    };
  }, [messages, isFullscreen, currentQuestionIndex, questionAnswers]);

  // Handler for modal answer selection (shared with inline QuestionBlock)
  const handleQuestionAnswer = useCallback((answer: string) => {
    if (!activeQuestion) return;
    const newAnswers = [...questionAnswers, answer];
    setQuestionAnswers(newAnswers);
    if (activeQuestion.questionIndex < activeQuestion.totalQuestions - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // Last question — submit all answers
      onSubmit(newAnswers.join("\n"));
    }
  }, [activeQuestion, questionAnswers, onSubmit]);

  // Handler for skipping/dismissing the modal
  const handleQuestionDismiss = useCallback(() => {
    if (!activeQuestion) return;
    // Skip = submit "skip" for remaining questions
    const newAnswers = [...questionAnswers];
    for (let i = currentQuestionIndex; i < activeQuestion.totalQuestions; i++) {
      if (newAnswers[i] === undefined) newAnswers.push("skip");
    }
    onSubmit(newAnswers.join("\n"));
  }, [activeQuestion, questionAnswers, currentQuestionIndex, onSubmit]);

  // Detect pending plan approval in fullscreen (plan proposed but not yet approved/rejected)
  const pendingApproval = useMemo(() => {
    if (!isFullscreen) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;
      const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
      if (!planTool) continue;

      // Check if user has responded
      const nextUserMsg = messages.slice(i + 1).find(m => m.role === 'user');
      if (nextUserMsg) return null; // Already responded

      // Check it's the latest message and not loading
      const isLatest = i === messages.length - 1;
      if (!isLatest || isLoading) return null;

      return true;
    }
    return null;
  }, [messages, isFullscreen, isLoading]);

  // Keyboard shortcuts for plan approval modal
  useEffect(() => {
    if (!pendingApproval || activeQuestion) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit("Approved! Go ahead.");
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSubmit("I'd like to make some changes.");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [pendingApproval, activeQuestion, onSubmit]);

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
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable', 'createSources'].includes(t.toolName)
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
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable', 'createSources'].includes(t.toolName)
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
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          {isFullscreen && onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title={isSidebarCollapsed ? "Open sidebar" : "Close sidebar"}
            >
              {isSidebarCollapsed ? (
                <IconSidebarGlobalClosed css={{ width: 18, height: 18 }} />
              ) : (
                <IconSidebarGlobalOpen css={{ width: 18, height: 18 }} />
              )}
            </button>
          )}
          <span className="text-sm font-medium text-gray-900">Sidekick</span>
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
          {!isFullscreen && onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Fullscreen chat"
            >
              <IconArrowsOutSimple css={{ width: 18, height: 18 }} />
            </button>
          )}
          {onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Minimize"
            >
              <IconMinus css={{ width: 18, height: 18 }} />
            </button>
          )}
        </div>
      </div>

      {/* Content area: chat + plan side by side, below header */}
      <div className={`flex flex-1 min-h-0 gap-6 ${isFullscreen && planPanel ? 'mx-auto' : ''}`} style={isFullscreen && planPanel ? { maxWidth: '1100px', width: '100%' } : undefined}>
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
      <div className={`flex-1 overflow-y-auto p-4 space-y-12 ${isFullscreen ? 'mx-auto w-full max-w-3xl' : ''}`}>
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

            // Check if this user message is a response to askUser
            // Look back up to 3 messages for an askUser assistant (handles duplicate user messages)
            let isAskUserResponse = false;
            let askUserAssistantMsg: Message | null = null;
            if (message.role === 'user') {
              for (let lookback = 1; lookback <= Math.min(3, index); lookback++) {
                const candidate = messages[index - lookback];
                if (candidate.role === 'assistant' && candidate.toolInvocations?.some(t => t.toolName === 'askUser')) {
                  // Verify no non-askUser-response user messages in between
                  const between = messages.slice(index - lookback + 1, index);
                  const allUserBetween = between.every(m => m.role === 'user');
                  if (allUserBetween || between.length === 0) {
                    isAskUserResponse = true;
                    askUserAssistantMsg = candidate;
                  }
                  break;
                }
                // Stop looking back if we hit another assistant message
                if (candidate.role === 'assistant') break;
              }
            }

            // In sidepanel: hide entirely (shown inline in Q&A).
            // In fullscreen: show first response as Q&A bubble, hide duplicates.
            if (isAskUserResponse && !isFullscreen) return null;
            // In fullscreen: only show the FIRST user message after askUser as Q&A bubble
            const prevMsg = index > 0 ? messages[index - 1] : null;
            const isFirstAskUserResponse = isAskUserResponse && prevMsg?.role === 'assistant' && prevMsg?.toolInvocations?.some(t => t.toolName === 'askUser');
            if (isAskUserResponse && isFullscreen && !isFirstAskUserResponse) return null;

            return (
              <div
                key={message.id}
                className={`${
                  message.role === "user" ? "flex justify-end" : ""
                }`}
              >
                {message.role === "user" ? (
                  isFirstAskUserResponse && isFullscreen ? (() => {
                    // Compact Q&A summary bubble
                    const askTool = askUserAssistantMsg!.toolInvocations!.find(t => t.toolName === 'askUser')!;
                    const askArgs = askTool.args as { questions?: Array<{ question: string }>; question?: string };
                    const questions = askArgs.questions || (askArgs.question ? [{ question: askArgs.question }] : []);
                    const answers = (message.content || '').split('\n');
                    return (
                      <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-gray-100 text-gray-900 space-y-2">
                        {questions.map((q, qi) => (
                          <div key={qi}>
                            <p className="text-sm text-gray-500">Q: {q.question}</p>
                            <p className="text-sm font-medium">{answers[qi] ? `A: ${answers[qi]}` : ''}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })() : (
                    <div className="max-w-[80%] rounded-2xl px-4 py-2 bg-gray-100 text-gray-900">
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                  )
                ) : (
                  /* AI message: full width, no bg */
                  <div className="w-full">
                    {/* Text + artifact cards — split at tool boundary for correct ordering */}
                    {(() => {
                      const hasText = message.content && !message.content.trim().startsWith('{');
                      const hasArtifactTools = message.toolInvocations?.some(t =>
                        ["createCanvas", "createLayout", "createFrame", "createSticky", "createShape", "createText", "createDocument", "createDataTable", "createSources", "createZone", "webSearch", "queryConnectors"].includes(t.toolName)
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
                            <div className={ackText ? "mt-4" : ""}>
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
                            <div className="mt-4 text-sm text-gray-900">
                              <Markdown components={mdComponents}>{summaryText}</Markdown>
                            </div>
                          )}
                        </>
                      );
                    })()}

                    {/* askUser tool - render as sequential Q&A conversation */}
                    {askUserTool && (() => {
                      // Fullscreen: hide all Q&A inline — the floating modal handles it
                      if (isFullscreen) return null;

                      const args = askUserTool.args as { questions?: Array<{ question: string; suggestions: string[] }>; question?: string; suggestions?: string[] };
                      const questions = args.questions || (args.question ? [{ question: args.question, suggestions: args.suggestions || [] }] : []);

                      // Check if user already submitted all answers
                      const nextUserMsg = messages.slice(index + 1).find(m => m.role === 'user');

                      if (nextUserMsg) {
                        // All answered -show static Q&A parsed from the submitted message
                        const answers = (nextUserMsg.content || '').split('\n');
                        return (
                          <div className={message.content ? "mt-5" : ""}>
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

                      // Active Q&A -show questions one at a time (sidepanel only)
                      return (
                        <div className={message.content ? "mt-5" : ""}>
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
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable', 'createSources'].includes(t.toolName)
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
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow', 'createDocument', 'createDataTable', 'createSources'].includes(t.toolName)
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

                      // In fullscreen: hide inline — floating modal handles approval
                      if (isFullscreen) return null;

                      return (
                        <div className={message.content ? "mt-5" : ""}>
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
                      <div className={message.content || askUserTool || confirmPlanTool ? "mt-5" : ""}>
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
                        <div className={message.content || askUserTool || confirmPlanTool ? "mt-5" : ""}>
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

{/* Single unified activity indicator - shows current activity */}
        {isLoading && messages.length > 0 && (() => {
            const lastMsg = messages[messages.length - 1];
            const recentTools = lastMsg.role === "assistant" ? lastMsg.toolInvocations || [] : [];

            // ── Activity indicator: zone progress → connectors → fallback ──
            const elapsed = activityStart > 0 ? Date.now() - activityStart : 0;
            const sources = connectorSourcesRef.current;

            let activityMsg: string | React.ReactNode = "Thinking...";

            // Count zone calls vs results (works because results are staggered in useAgent)
            const zoneCalls = recentTools.filter(t => t.toolName === 'createZone');
            const zoneResults = recentTools.filter(t => t.toolName === 'createZone_result');

            const hasCanvasTools = recentTools.some(t =>
              ["createZone", "createDocument", "createDataTable", "createLayout", "createFrame", "createSources"].includes(t.toolName)
            );

            // Track zone dispatches — when a new result appears, record timestamp
            if (zoneResults.length > 0 && zoneCalls.length > 0) {
              const prevCount = lastZoneRef.current?.resultCount || 0;
              if (zoneResults.length > prevCount) {
                // New result just appeared — record which zone and when
                const matchIdx = zoneResults.length - 1;
                const matchingCall = zoneCalls[matchIdx];
                const title = matchingCall ? (matchingCall.args as { title?: string }).title || "zone" : "zone";
                lastZoneRef.current = { title, resultCount: zoneResults.length, timestamp: Date.now() };
              }
            }

            // Priority 1A: Zone being created (calls > results due to staggering)
            if (zoneCalls.length > zoneResults.length) {
              const inProgress = zoneCalls[zoneResults.length]; // first unmatched call
              const title = (inProgress.args as { title?: string }).title || "zone";
              activityMsg = `Creating zone ${title}...`;
            }
            // Priority 1B: Zone just appeared — linger for 1.5s so indicator
            // stays in sync while the zone is visible on canvas
            else if (lastZoneRef.current && Date.now() - lastZoneRef.current.timestamp < 1500) {
              activityMsg = `Creating zone ${lastZoneRef.current.title}...`;
            }
            // Priority 2: Fake connector cycling (before any canvas tool appears)
            else if (elapsed > 0 && elapsed < 20000 && !hasCanvasTools) {
              if (elapsed < 2000) {
                activityMsg = "Finding relevant data...";
              } else {
                const idx = Math.floor((elapsed - 2000) / 4000) % sources.length;
                const src = sources[idx];
                const icon = serviceIcons[src.key];
                activityMsg = (
                  <span className="inline-flex items-center gap-1.5">
                    {icon && <span className="inline-flex text-slate-400">{icon}</span>}
                    Connecting to {src.name}...
                  </span>
                );
              }
            }
            // Priority 3: Plan confirmation
            else if (recentTools.some(t => t.toolName === 'confirmPlan') && !hasCanvasTools) {
              activityMsg = "Creating plan...";
            }
            // Priority 4: Latest step title as fallback
            else {
              const showProgressTools = recentTools.filter(t => t.toolName === 'showProgress');
              if (showProgressTools.length > 0) {
                const latest = showProgressTools[showProgressTools.length - 1];
                const pargs = latest.args as { stepTitle?: string };
                if (pargs.stepTitle) activityMsg = `${pargs.stepTitle}...`;
              }
            }

            return (
              <div className="flex items-center gap-2">
                <ThinkingLottie size={20} />
                <span className="text-sm text-slate-400">{activityMsg}</span>
              </div>
            );
          })()
        }

        {/* Scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating progress indicator - removed (was dead code) */}

      {/* Fullscreen question modal — floats above input */}
      {isFullscreen && activeQuestion && !isLoading && (
        <div className="flex justify-center px-4 pb-2 mx-auto w-full" style={{ maxWidth: 720 }}>
          <FloatingQuestionCard
            question={activeQuestion.question}
            options={activeQuestion.suggestions}
            onSelect={handleQuestionAnswer}
            onSkip={handleQuestionDismiss}
          />
        </div>
      )}

      {/* Fullscreen plan approval modal — floats above input */}
      {isFullscreen && pendingApproval && !activeQuestion && (
        <div className="flex justify-center px-4 pb-2 mx-auto w-full" style={{ maxWidth: 720 }}>
          <div className="w-full">
            <div className="bg-white text-gray-900 shadow-2xl overflow-hidden border border-gray-200" style={{ borderRadius: 24 }}>
              <div className="px-5 pt-4 pb-2">
                <p className="text-base font-medium">Ready to start?</p>
              </div>
              <div className="px-4 pb-4 flex gap-2">
                <button
                  onClick={() => onSubmit("I'd like to make some changes.")}
                  className="flex-1 px-4 py-3 text-sm bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                  style={{ borderRadius: 14 }}
                >
                  Modify
                </button>
                <button
                  onClick={() => onSubmit("Approved! Go ahead.")}
                  className="flex-1 px-4 py-3 text-sm bg-gray-900 text-white hover:bg-gray-800 transition-colors"
                  style={{ borderRadius: 14 }}
                >
                  Approve & Start
                </button>
              </div>
            </div>
            <div className="py-2 text-xs text-gray-400 text-center">
              Enter to approve · Esc to modify
            </div>
          </div>
        </div>
      )}

      {/* Input — hidden when fullscreen modal is showing */}
      {!(isFullscreen && (activeQuestion || pendingApproval) && !isLoading) && (
        <div className={`relative p-4 ${isFullscreen ? 'mx-auto w-full max-w-3xl' : ''}`}>
          {isVoiceActive ? (
            <VoiceStopButton
              voiceState={voiceState}
              onStop={() => onVoiceToggle?.()}
            />
          ) : (
            <ChatInput
              onSubmit={onSubmit}
              onFocusChange={() => {}}
              onVoiceStart={onVoiceToggle}
              isLoading={isLoading}
              hasMessages={messages.length > 0}
              hasPendingQuestion={false}
              canvasState={canvasState}
              voiceState={voiceState}
            />
          )}
        </div>
      )}

        </div>{/* end chat column */}

        {/* Plan panel — card style, slides in from right */}
        <AnimatePresence>
          {planPanel && isPlanPanelVisible && (
            <motion.div
              className="flex-shrink-0 self-start relative mt-4"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 340, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              style={{ overflow: "hidden" }}
            >
              <div
                className="bg-white rounded-2xl overflow-hidden"
                style={{ width: 340, border: "1px solid #e5e7eb" }}
              >
                {planPanel}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>{/* end content area */}
    </div>
  );
}
