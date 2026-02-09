"use client";

import type { Message } from "@/hooks/useAgent";
import { useState, useEffect, useRef } from "react";
import Markdown from "react-markdown";
import {
  IconPlus,
  IconMicrophone,
  IconArrowUp,
} from "@mirohq/design-system-icons";

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
  messages: Message[];
  input: string;
  setInput: (input: string) => void;
  onSubmit: (text: string) => void;
  isLoading: boolean;
  hideHeader?: boolean;
  onNavigateToFrames?: (frameIds: string[]) => void;
  isFullscreen?: boolean;
  onExitFullscreen?: () => void;
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
        <div className="w-4 h-4 flex-shrink-0">
          <svg className="animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      );
    case 'done':
      return (
        <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
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
}: {
  title: string;
  steps: string[];
  currentStep: number;
  isExecuting: boolean;
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
        className="w-full px-4 pt-3 pb-2 flex items-center gap-3 hover:bg-gray-100 transition-colors"
      >
        {/* Spinner circle */}
        <div className="relative w-6 h-6 flex-shrink-0">
          <svg className={`w-6 h-6 ${isExecuting ? 'animate-spin' : '-rotate-90'}`} viewBox="0 0 36 36">
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

        {/* Title and current step */}
        <div className="flex-1 text-left min-w-0">
          <p className="text-xs font-medium text-gray-900 truncate">{title}</p>
          {!isComplete && (
            <p className="text-xs text-gray-500 truncate">
              {isExecuting ? "Working on: " : "Next: "}{currentStepText}
            </p>
          )}
          {isComplete && (
            <p className="text-xs text-green-600 font-medium">Complete!</p>
          )}
        </div>

        {/* Step count */}
        <span className="text-xs text-gray-400">{completedSteps}/{steps.length}</span>

        {/* Expand icon */}
        <svg
          className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Progress bar - inset below text, subtle */}
      <div className="px-4 pb-3">
        <div className="h-0.5 w-full rounded-full bg-gray-200 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${isComplete ? 'bg-green-400' : 'bg-blue-300'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Expanded steps list */}
      {isExpanded && (
        <div className="px-4 py-2 border-t border-gray-200 bg-white max-h-48 overflow-y-auto">
          {steps.map((step, i) => {
            const isDone = i < completedSteps;
            const isRunning = i === currentStep && isExecuting;
            return (
              <div key={i} className="flex gap-2 py-1 text-xs items-start">
                <div className="mt-0.5">
                  <TaskStatusIcon status={isDone ? 'done' : isRunning ? 'running' : 'pending'} />
                </div>
                <span className={`${isDone ? 'text-gray-400 line-through' : isRunning ? 'text-blue-700' : 'text-gray-600'}`}>
                  {i + 1}. {step}
                </span>
              </div>
            );
          })}
        </div>
      )}
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

// Collapsible tool invocation block (for create tools) - the original nice component
function ToolBlock({ toolInvocations }: { toolInvocations: Message["toolInvocations"] }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!toolInvocations || toolInvocations.length === 0) return null;

  // Filter to only canvas creation/modification tools
  const canvasTools = toolInvocations.filter(
    (t) => ["createSticky", "createShape", "createText", "createFrame", "createArrow", "createWorkingNote", "deleteItem", "updateSticky", "moveItem"].includes(t.toolName)
  );
  if (canvasTools.length === 0) return null;

  // Generate summary text
  const getSummary = () => {
    const counts: Record<string, number> = {};
    canvasTools.forEach((t) => {
      const name = t.toolName.replace("create", "").replace("Item", "").replace("Sticky", "sticky").toLowerCase();
      counts[name] = (counts[name] || 0) + 1;
    });

    const parts = Object.entries(counts).map(([name, count]) => {
      const plural = count > 1 ? "s" : "";
      return `${count} ${name}${plural}`;
    });

    return `Created ${parts.join(", ")}`;
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-gray-200 hover:bg-gray-50 text-left transition-colors"
      >
        <span className="text-sm text-gray-500">{getSummary()}</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {isOpen && (
        <div className="mt-1 px-4 py-2 rounded-xl border border-gray-200 max-h-48 overflow-y-auto">
          {canvasTools.map((tool, i) => (
            <div key={i} className="text-xs text-gray-500 py-1">
              <span className="text-green-600 mr-2">✓</span>
              {tool.toolName === "createSticky" && (
                <>Sticky: "{((tool.args as { text: string }).text || "").slice(0, 40)}..."</>
              )}
              {tool.toolName === "createShape" && (
                <>Shape: {(tool.args as { type: string }).type}</>
              )}
              {tool.toolName === "createText" && (
                <>Text: "{((tool.args as { text: string }).text || "").slice(0, 40)}..."</>
              )}
              {tool.toolName === "createFrame" && (
                <>Frame: "{(tool.args as { name: string }).name}"</>
              )}
              {tool.toolName === "createArrow" && (
                <>Arrow</>
              )}
              {tool.toolName === "createWorkingNote" && (
                <>Working note: "{(tool.args as { title: string }).title}"</>
              )}
              {tool.toolName === "deleteItem" && (
                <>Deleted item</>
              )}
              {tool.toolName === "updateSticky" && (
                <>Updated sticky</>
              )}
              {tool.toolName === "moveItem" && (
                <>Moved item</>
              )}
            </div>
          ))}
        </div>
      )}
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
        <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
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
        <svg
          className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
        </svg>
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
  messages,
  input,
  setInput,
  onSubmit,
  isLoading,
  hideHeader = false,
  onNavigateToFrames,
  isFullscreen = false,
  onExitFullscreen,
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

  // Auto-focus input when panel opens
  useEffect(() => {
    // Small delay to ensure panel animation completes
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow'].includes(t.toolName)
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
        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow'].includes(t.toolName)
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
    <div className={`w-full h-full bg-white flex flex-col ${hideHeader ? '' : 'border-l border-gray-200 shadow-xl'}`}>
      {/* Header */}
      {!hideHeader && (
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          {isFullscreen && onExitFullscreen && (
            <button
              onClick={onExitFullscreen}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Back to canvas"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}
          <span className="text-sm font-medium text-gray-900">Chat</span>
          <span className="text-xs text-gray-500">with AI</span>
        </div>
        <div className="flex items-center gap-1">
          {!isFullscreen && onCollapse && (
            <button
              onClick={onCollapse}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Minimize to toast"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 12h14" />
              </svg>
            </button>
          )}
          {!isFullscreen && onExpand && (
            <button
              onClick={onExpand}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
              title="Fullscreen chat"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
              </svg>
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Close"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        </div>
      )}

      {/* Task progress header - shows when plan is executing (hidden in fullscreen) */}
      {activePlan && !isFullscreen && (
        <TaskProgressHeader
          title={activePlan.title}
          steps={activePlan.steps}
          currentStep={activePlan.currentStep}
          isExecuting={activePlan.isExecuting}
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
                    {/* Hide text content if: askUser tool is present OR content looks like JSON (tool output) */}
                    {message.content && !askUserTool && !message.content.trim().startsWith('{') && (
                      <div className="text-sm text-gray-900">
                        <Markdown
                          components={{
                            p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                            strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                            em: ({ children }) => <em className="italic">{children}</em>,
                            ul: ({ children }) => <ul className="list-disc pl-4 mb-2">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal pl-4 mb-2">{children}</ol>,
                            li: ({ children }) => <li className="mb-0.5">{children}</li>,
                            code: ({ children }) => <code className="bg-gray-100 px-1 rounded text-xs">{children}</code>,
                          }}
                        >
                          {message.content}
                        </Markdown>
                      </div>
                    )}

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
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow'].includes(t.toolName)
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
                        ['createSticky', 'createShape', 'createText', 'createFrame', 'createArrow'].includes(t.toolName)
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

                      // In fullscreen: only show approve/reject buttons (steps are in sidebar)
                      if (isFullscreen) {
                        if (!isLatestMessage || executionStarted) return null;
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

                      // Extract frame names from createLayout calls in this message
                      const frameNames: string[] = [];
                      message.toolInvocations?.forEach(t => {
                        if (t.toolName === "createLayout") {
                          const args = t.args as { frameName?: string };
                          if (args.frameName) frameNames.push(args.frameName);
                        }
                      });

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

                    {/* Tool invocations - collapsible list */}
                    {message.toolInvocations && message.toolInvocations.length > 0 && (
                      <div className={message.content || askUserTool || confirmPlanTool ? "mt-3" : ""}>
                        <ToolBlock toolInvocations={message.toolInvocations} />
                      </div>
                    )}
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

            // Check for various tool types
            const lastSearchTool = [...recentTools].reverse().find(t => t.toolName === "webSearch");
            const lastCanvasTool = [...recentTools].reverse().find(t =>
              ["createSticky", "createShape", "createText", "createFrame", "createArrow", "createWorkingNote"].includes(t.toolName)
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
                  default: return "Working...";
                }
              }
              return "Thinking...";
            };

            // Count canvas items being created
            const canvasItemCount = recentTools.filter(t =>
              ["createSticky", "createShape", "createText", "createFrame", "createArrow"].includes(t.toolName)
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

      {/* Floating progress indicator - shows current step being worked on */}
      {activePlan && activePlan.isExecuting && (
        <div className={`absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none ${isFullscreen ? 'max-w-3xl' : ''}`}>
          <div className="pointer-events-auto bg-gray-100 text-gray-900 shadow-md hover:bg-gray-200 transition-colors overflow-hidden rounded-full cursor-pointer px-4 py-2">
            <div className="flex items-center gap-3">
              {/* Progress indicator */}
              <div className="flex items-center gap-2">
                <div className="relative w-6 h-6 flex-shrink-0">
                  <svg className="w-6 h-6 -rotate-90">
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-300" />
                    <circle
                      cx="12" cy="12" r="10"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-blue-500"
                      strokeDasharray={`${((activePlan.currentStep + 1) / activePlan.steps.length) * 63} 63`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-gray-700">
                    {activePlan.currentStep + 1}/{activePlan.steps.length}
                  </span>
                </div>

                {/* Current step text */}
                <span className="text-sm font-medium truncate max-w-[300px]">
                  {activePlan.steps[activePlan.currentStep]}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

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
    </div>
  );
}
