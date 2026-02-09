"use client";

import { Tldraw, Editor, createShapeId, toRichText, TLShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useAgent, Message } from "@/hooks/useAgent";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";
import { IconSingleSparksFilled, IconViewSideRight, IconSidebarGlobalOpen, IconSidebarGlobalClosed, IconArrowLeft, IconCross } from "@mirohq/design-system-icons";
import { calculateLayout, findEmptyCanvasSpace } from "@/lib/layoutEngine";
import type { LayoutType, LayoutItem, LayoutOptions } from "@/types/layout";
import Markdown from "react-markdown";

// Audio chimes for voice mode
function playChime(type: 'start' | 'end') {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Gentle chime parameters
    const gainNode = audioContext.createGain();
    gainNode.connect(audioContext.destination);
    gainNode.gain.value = 0.1; // Very subtle volume

    const playNote = (frequency: number, startTime: number, duration: number) => {
      const oscillator = audioContext.createOscillator();
      oscillator.type = 'sine';
      oscillator.frequency.value = frequency;
      oscillator.connect(gainNode);

      // Gentle envelope
      gainNode.gain.setValueAtTime(0, startTime);
      gainNode.gain.linearRampToValueAtTime(0.08, startTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      oscillator.start(startTime);
      oscillator.stop(startTime + duration);
    };

    if (type === 'start') {
      // Ascending chime: C5 -> E5 -> G5 (welcoming)
      playNote(523.25, now, 0.15);           // C5
      playNote(659.25, now + 0.08, 0.15);    // E5
      playNote(783.99, now + 0.16, 0.2);     // G5
    } else {
      // Descending chime: G5 -> E5 -> C5 (gentle closing)
      playNote(783.99, now, 0.15);           // G5
      playNote(659.25, now + 0.08, 0.15);    // E5
      playNote(523.25, now + 0.16, 0.2);     // C5
    }
  } catch (err) {
    console.warn('[AUDIO] Failed to play chime:', err);
  }
}

// Floating thinking indicator
function FloatingThinkingIndicator({ status = "Thinking..." }: { status?: string }) {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
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
function FloatingVoiceIndicator({ state, onEnd }: { state: "listening" | "speaking"; onEnd: () => void }) {
  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2">
      <div className="flex items-center gap-3 bg-white rounded-full pl-5 pr-3 py-3 shadow-lg border border-gray-200">
        <div className="flex gap-1">
          <span className={`w-2 h-2 rounded-full ${state === "listening" ? "bg-green-500" : "bg-blue-500"} animate-pulse`} />
          <span className={`w-2 h-2 rounded-full ${state === "listening" ? "bg-green-500" : "bg-blue-500"} animate-pulse`} style={{ animationDelay: "0.2s" }} />
          <span className={`w-2 h-2 rounded-full ${state === "listening" ? "bg-green-500" : "bg-blue-500"} animate-pulse`} style={{ animationDelay: "0.4s" }} />
        </div>
        <span className="text-sm text-gray-600">
          {state === "listening" ? "Listening..." : "Speaking..."}
        </span>
        <button
          onClick={onEnd}
          className="ml-1 p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
          title="End voice mode"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Floating question card (Claude Cowork style)
function FloatingQuestionCard({
  question,
  options,
  onSelect,
  onSkip,
}: {
  question: string;
  options: string[];
  onSelect: (answer: string) => void;
  onSkip: () => void;
}) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [customInput, setCustomInput] = useState("");
  const [showCustomInput, setShowCustomInput] = useState(false);

  // Filter out "something else" from options since we have built-in custom input
  const filteredOptions = options.filter(opt => !opt.toLowerCase().includes('something else'));

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in input
      if (showCustomInput) return;

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(0, prev - 1));
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(filteredOptions.length, prev + 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (selectedIndex === filteredOptions.length) {
          setShowCustomInput(true);
        } else {
          onSelect(filteredOptions[selectedIndex]);
        }
      } else if (e.key === "Escape") {
        e.preventDefault();
        onSkip();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedIndex, filteredOptions, onSelect, onSkip, showCustomInput]);

  const handleCustomSubmit = () => {
    if (customInput.trim()) {
      onSelect(customInput.trim());
    }
  };

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[520px]">
      <div className="bg-white text-gray-900 shadow-2xl overflow-hidden border border-gray-200" style={{ borderRadius: '32px' }}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <p className="text-base font-medium flex-1 pr-4">{question}</p>
          <button
            onClick={onSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Options or Custom Input */}
        {showCustomInput ? (
          <div className="px-4 pb-4">
            <input
              autoFocus
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && customInput.trim()) {
                  e.preventDefault();
                  handleCustomSubmit();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setShowCustomInput(false);
                  setCustomInput("");
                }
              }}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 bg-gray-100 rounded-lg text-gray-900 placeholder-gray-400 outline-none border border-gray-200 focus:border-gray-300"
            />
            <div className="flex justify-end gap-2 mt-3">
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setCustomInput("");
                }}
                className="px-3 py-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleCustomSubmit}
                disabled={!customInput.trim()}
                className="px-4 py-1.5 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Submit
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="px-3 py-2 space-y-1">
              {filteredOptions.map((option, i) => (
                <button
                  key={i}
                  onClick={() => onSelect(option)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors animate-slideInFromLeft ${
                    selectedIndex === i ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <span className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-sm font-medium text-gray-600">
                    {i + 1}
                  </span>
                  <span className="text-left flex-1">{option}</span>
                  {selectedIndex === i && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-gray-400">
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  )}
                </button>
              ))}

              {/* Something else option */}
              <button
                onClick={() => setShowCustomInput(true)}
                className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                  selectedIndex === filteredOptions.length ? "bg-gray-100" : "hover:bg-gray-50"
                }`}
              >
                <span className="w-7 h-7 flex items-center justify-center rounded bg-gray-100 text-gray-500">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 20h9M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                  </svg>
                </span>
                <span className="text-gray-400">Something else</span>
              </button>
            </div>

            {/* Skip button */}
            <div className="px-5 py-3 flex justify-end border-t border-gray-100">
              <button
                onClick={onSkip}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors"
              >
                Skip
              </button>
            </div>

            {/* Keyboard hints */}
            <div className="px-5 py-2 text-xs text-gray-400 text-center border-t border-gray-100">
              ↑↓ to navigate · Enter to select · Esc to skip
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// Plan progress panel for fullscreen chat (matches ChatPanel PlanBlock styling)
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
    <div className="w-80 bg-white border-l border-gray-200 h-full flex-shrink-0 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
        <div>
          <h3 className="text-sm font-medium text-gray-900">Plan</h3>
          <p className="text-xs text-gray-500">{isPending ? 'Awaiting approval' : `${completedSteps} of ${plan.steps.length}`}</p>
        </div>
        {onToggleVisibility && (
          <button
            onClick={onToggleVisibility}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
            title="Hide plan"
          >
            <IconSidebarGlobalOpen css={{ transform: 'rotate(180deg)' }} />
          </button>
        )}
      </div>

      {/* Steps */}
      <div className="p-4 overflow-y-auto flex-1">
        <div className="space-y-3">
          {plan.steps.map((step, index) => {
            const status = getStepStatus(index);
            return (
              <div key={index} className="flex items-start gap-3 text-sm">
                {status === 'pending' && (
                  <div className="w-4 h-4 rounded-full border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                )}
                {status === 'running' && (
                  <div className="w-4 h-4 flex-shrink-0 mt-0.5">
                    <svg className="animate-spin text-blue-500" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                )}
                {status === 'done' && (
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
                <span className={status === 'done' ? 'text-gray-400 line-through' : 'text-gray-700'}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

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
    <div className="absolute bottom-28 left-1/2 -translate-x-1/2 w-[420px]">
      <div
        onClick={onViewDetails}
        className="flex items-center gap-3 bg-white text-gray-900 shadow-lg border border-gray-200 px-4 cursor-pointer hover:bg-gray-50 transition-colors"
        style={{ borderRadius: '32px', paddingTop: '16px', paddingBottom: '16px' }}
      >
        {/* Icon */}
        <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-3.5 h-3.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
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
}: {
  messages: Message[];
  isLoading: boolean;
  onOpenPanel: () => void;
  onSubmit: (text: string, options?: { openPanel?: boolean }) => void;
  editor: Editor;
  hasToast?: boolean;
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
      <div className="absolute left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 bottom-28">
        <div className="flex items-center gap-2 bg-green-600 text-white shadow-lg px-4 py-3 pb-3.5 w-[420px]" style={{ borderRadius: '32px' }}>
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
      <div className="absolute left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-2 duration-300 bottom-28">
        <div
          onClick={handleReviewBatch}
          className="bg-blue-600 text-white shadow-lg overflow-hidden w-[420px] hover:bg-blue-700 transition-colors cursor-pointer"
          style={{ borderRadius: '32px' }}
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
        style={{ borderRadius: '32px' }}
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

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [input, setInput] = useState("");
  const [responseToast, setResponseToast] = useState<string | null>(null);
  const [toastCentered, setToastCentered] = useState(false);
  const [isToolbarExpanded, setIsToolbarExpanded] = useState(false);
  const [isInQAFlow, setIsInQAFlow] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionAnswers, setQuestionAnswers] = useState<string[]>([]);
  const [dismissedPlan, setDismissedPlan] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(384); // 384px = w-96
  const [isResizing, setIsResizing] = useState(false);
  const [isFullscreenChat, setIsFullscreenChat] = useState(false);
  const [isPlanPanelVisible, setIsPlanPanelVisible] = useState(true);
  const wasLoadingRef = useRef(false);
  const createdShapesRef = useRef<TLShapeId[]>([]);
  const isProcessingToolCallRef = useRef(false);
  const userEditsRef = useRef<Array<{ shapeId: string; field: string; oldValue: string; newValue: string }>>([]);
  const shouldHideToastRef = useRef(false); // Track if toast should be hidden during new request
  const voiceRef = useRef<{ isConnected: boolean; sendCanvasUpdate: () => void; sendScreenshot: (changeDescription?: string) => void } | null>(null);
  const screenshotTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastScreenshotShapeIdsRef = useRef<Set<string>>(new Set());
  const waitingForGoodbyeRef = useRef(false);
  const goodbyeTranscriptLengthRef = useRef(0); // Track goodbye message length for audio timing
  const hasPlayedStartChimeRef = useRef(false); // Track if start chime played for this session

  // Voice mode with OpenAI Realtime API
  const voice = useRealtimeVoice();

  // Keep voiceRef in sync for use in callbacks
  useEffect(() => {
    voiceRef.current = voice;
  }, [voice]);

  // Handle sidebar close (instant, no animation)
  const handleCloseChat = useCallback((dismissPlan = true) => {
    setIsChatOpen(false);
    if (dismissPlan) {
      // X button = close completely, hide ALL floating UI
      setResponseToast(null);
      setToastCentered(false);
      setDismissedPlan(true); // Mark plan as dismissed so it doesn't float back
      setIsInQAFlow(false); // Exit Q&A flow to restore hybrid toolbar
    }
    // (Minus button handles restoration explicitly in onCollapse)
  }, []);

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
        { format: 'png', pixelRatio: 1 }
      );

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
    const shapes = editor.getCurrentPageShapes();

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

    return { frames: frameData, orphans, arrows: topArrows };
  }, [editor, extractText]);

  // Handle tool calls from the agent
  const handleToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      if (!editor) return;

      isProcessingToolCallRef.current = true;
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
          meta: { createdBy: "ai" },
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
          meta: { createdBy: "ai" },
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
          meta: { createdBy: "ai" },
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
          meta: { createdBy: "ai" },
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
          meta: { createdBy: "ai" },
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
          meta: { createdBy: "ai" },
        });
      }

      // CREATE LAYOUT - use tldraw native layout for grids, custom for hierarchy
      if (toolName === "createLayout") {
        const layout = args as {
          type: LayoutType;
          frameName: string;
          replaceFrame?: string;
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

        // Delete old frame if replacing
        if (layout.replaceFrame) {
          const allShapes = editor.getCurrentPageShapes();
          const frameToDelete = allShapes.find(
            (s) => s.type === "frame" &&
            ((s.props as { name?: string }).name === layout.replaceFrame ||
             (s.props as { name?: string }).name?.includes(layout.replaceFrame!))
          );
          if (frameToDelete) {
            const shapesInFrame = allShapes.filter((s) => s.parentId === frameToDelete.id);
            shapesInFrame.forEach((shape) => editor.deleteShape(shape.id));
            editor.deleteShape(frameToDelete.id);
          }
        }

        // HIERARCHY layout: Always use layout engine for clean columnar structure
        // Triggers when: type="hierarchy" OR any item has parentIndex set
        const hasParentIndex = layout.items.some(item => item.parentIndex !== undefined);
        const useHierarchyLayout = layout.type === "hierarchy" || hasParentIndex;

        if (useHierarchyLayout) {
          console.log('[LAYOUT] Using hierarchy layout engine');

          // Convert items for layout engine (parentIndex -1 = root = undefined)
          // All items are shapes now (no stickies)
          const layoutItems: LayoutItem[] = layout.items.map((item) => ({
            type: "shape" as const,
            text: item.text,
            color: item.color,
            parentIndex: item.parentIndex === -1 ? undefined : item.parentIndex,
          }));

          const options: LayoutOptions = {
            columns: layout.columns,
            direction: layout.direction,
            spacing: layout.spacing,
          };

          const result = calculateLayout("hierarchy", layoutItems, options);
          const canvasPos = findEmptyCanvasSpace(editor, result.frame.width, result.frame.height);

          // Create frame
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

        // GRID: Real sticky notes for brainstorming
        // FLOW: Shapes for processes
        const isGrid = layout.type === "grid" || layout.type === undefined;
        console.log('[LAYOUT] Using', isGrid ? 'GRID (stickies)' : 'FLOW (shapes)', 'with', layout.items.length, 'items');

        // Settings - stickies need MORE space because they auto-size
        const columns = layout.columns || 3;
        const itemWidth = isGrid ? 200 : 220;  // Stickies are ~200 wide
        const itemHeight = isGrid ? 200 : 120; // Stickies expand vertically - give lots of room
        const gapX = layout.spacing === "compact" ? 40 : layout.spacing === "spacious" ? 80 : 60;
        const gapY = layout.spacing === "compact" ? 40 : layout.spacing === "spacious" ? 80 : 60;
        const padding = 80;
        const titleSpace = 70;

        // Calculate frame size
        const rows = Math.ceil(layout.items.length / columns);
        const actualCols = Math.min(columns, layout.items.length);
        const frameWidth = padding * 2 + actualCols * itemWidth + (actualCols - 1) * gapX;
        const frameHeight = padding + titleSpace + rows * itemHeight + (rows - 1) * gapY + padding;

        const canvasPos = findEmptyCanvasSpace(editor, frameWidth, frameHeight);
        console.log('[LAYOUT] Frame at', canvasPos, 'size', frameWidth, 'x', frameHeight);

        // Create frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
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

          // Position in grid (relative to frame)
          const x = padding + col * (itemWidth + gapX);
          const y = titleSpace + padding + row * (itemHeight + gapY);

          if (isGrid) {
            // GRID: Real sticky notes (post-its)
            editor.createShape({
              id: itemId,
              type: "note",
              x,
              y,
              parentId: frameId,
              props: {
                richText: toRichText(item.text || ""),
                color: colorMap[item.color || "yellow"] || "yellow",
                size: "m",
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
                h: itemHeight,
                color: colorMap[item.color || "blue"] || "blue",
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
        const bookmarkHeight = 380;  // Bookmarks with image + title + description
        const gapX = 40;
        const gapY = 50;
        const columns = 2;
        const padding = 60;
        const bottomPadding = 100;  // Extra space at bottom for frame border

        // Calculate frame size based on number of sources
        const rows = Math.ceil(sources.length / columns);
        const frameWidth = columns * bookmarkWidth + (columns + 1) * gapX + padding * 2;
        const frameHeight = rows * bookmarkHeight + (rows + 1) * gapY + padding + bottomPadding;

        // Find empty space on canvas
        const canvasPos = findEmptyCanvasSpace(editor, frameWidth, frameHeight);

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
        createdShapesRef.current.push(frameId);

        // Create bookmark assets and shapes for each source
        sources.forEach((source, i) => {
          const col = i % columns;
          const row = Math.floor(i / columns);

          // Relative position inside frame (starts at 0,0)
          const relativeX = padding + col * (bookmarkWidth + gapX);
          const relativeY = padding + row * (bookmarkHeight + gapY);

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
              image: source.image || "",  // Thumbnail from search results
              favicon: "",
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
              h: bookmarkHeight,
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
        const canvasPos = findEmptyCanvasSpace(editor, frameWidth, frameHeight);

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

      isProcessingToolCallRef.current = false;
    },
    [editor, findNonOverlappingPosition]
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

      console.log("[EDIT-DETECT] hasShapeChanges:", hasShapeChanges, "voiceConnected:", voiceRef.current?.isConnected, "added:", Object.keys(entry.changes.added).length, "updated:", Object.keys(entry.changes.updated).length, "removed:", Object.keys(entry.changes.removed).length);

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
          console.log("[EDIT-DETECT] Sending screenshot with diff:", desc);
          voiceRef.current?.sendScreenshot(desc);
          screenshotTimerRef.current = null;
        }, 800);
      }
    }, { source: "user", scope: "document" });

    return unsub;
  }, [editor]);

  const { messages, append, isLoading, setMessages } = useAgent(handleToolCall, getCanvasState, getUserEdits);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSubmit = useCallback(
    (text: string, options?: { openPanel?: boolean }) => {
      if (!text.trim()) return;

      // Hide any existing toast immediately when new request starts
      setResponseToast(null);
      setToastCentered(false);
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
        setIsChatOpen(true);
      }
    },
    [append, voice, setMessages]
  );

  // Wrapper for disconnect that plays end chime
  const handleVoiceDisconnect = useCallback(() => {
    playChime('end');
    voice.disconnect();
    // Reset session flags
    hasPlayedStartChimeRef.current = false;
    waitingForGoodbyeRef.current = false;
    goodbyeTranscriptLengthRef.current = 0;
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
    if (voice.isConnected) {
      playChime('end');
      voice.disconnect();
    } else {
      // Don't play chime here - wait until voice is actually listening
      voice.connect(handleToolCall, handleVoiceTranscript, handleVoiceMessageToolCall, getCanvasState, captureScreenshot);
    }
  }, [voice, handleToolCall, handleVoiceTranscript, handleVoiceMessageToolCall, getCanvasState, captureScreenshot]);

  // Handle voice state transitions and auto-close
  useEffect(() => {
    if (voice.state === "listening") {
      // Initial connection: play start chime once
      if (!hasPlayedStartChimeRef.current && !waitingForGoodbyeRef.current) {
        console.log('[VOICE] Initial connection ready, playing start chime');
        playChime('start');
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

  // Check if there's an active plan (approved and executing)
  const hasActivePlan = useMemo(() => {
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const planTool = msg.toolInvocations?.find(t => t.toolName === 'confirmPlan');
      if (planTool) {
        // Check if next user message is approval
        const nextMsg = messages[i + 1];
        if (nextMsg?.role === 'user' && nextMsg.content?.toLowerCase().includes('approve')) {
          return true;
        }
      }
    }
    return false;
  }, [messages]);

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

  // Auto-open plan panel when a plan appears in fullscreen mode
  useEffect(() => {
    if (activePlanDetails && isFullscreenChat) {
      setIsPlanPanelVisible(true);
    }
  }, [activePlanDetails, isFullscreenChat]);

  // Update toast in real-time during streaming (when sidebar is closed)
  useEffect(() => {
    if (isLoading && !isChatOpen && !voice.isConnected) {
      // Only update toast if we're actively streaming an assistant response
      const lastMsg = messages[messages.length - 1];
      if (lastMsg?.role === 'assistant' && lastMsg.content && lastMsg.content.trim()) {
        shouldHideToastRef.current = false; // Allow toast to show for new response
        setResponseToast(lastMsg.content.trim());
        setToastCentered(true);
      }
    }
  }, [messages, isLoading, isChatOpen, voice.isConnected]);

  // Detect when AI finishes responding → show toast if sidebar is closed
  useEffect(() => {
    if (isLoading) {
      wasLoadingRef.current = true;
    } else if (wasLoadingRef.current) {
      wasLoadingRef.current = false;
      // Just finished loading — check if sidebar is closed and not in voice mode
      if (!isChatOpen && !voice.isConnected) {
        // Find last assistant message with text content
        for (let i = messages.length - 1; i >= 0; i--) {
          const msg = messages[i];
          if (msg.role === "assistant" && msg.content && msg.content.trim()) {
            setResponseToast(msg.content.trim());
            // Always center toast - it will position itself relative to toolbar state
            setToastCentered(true);
            break;
          }
        }
      }
    }
  }, [isLoading, isChatOpen, voice.isConnected, messages]);

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

  // Simple flags for what floating UI to show (only one at a time, in priority order)
  // Priority: question > plan approval > thinking > progress indicator
  // Voice and text both use the same messages-based pendingQuestion
  const showFloatingQuestion = !isChatOpen && !!pendingQuestion && !isLoading;
  // Plan only shows after loading completes (so thinking can show while processing)
  const showFloatingPlan = !isChatOpen && !!pendingPlan && !pendingQuestion && !isLoading && !dismissedPlan;
  // Thinking shows when loading BUT NOT during plan execution (progress indicator handles that)
  const showFloatingThinking = !isChatOpen && isLoading && !hasActivePlan;
  const showFloatingProgress = !isChatOpen && hasActivePlan && !showFloatingQuestion && !showFloatingPlan && !showFloatingThinking;

  // Lock toolbar in canvas-tools mode during entire Q&A/plan flow
  // Enter flow when question/plan appears, exit when plan execution starts or flow ends
  useEffect(() => {
    if (showFloatingQuestion || showFloatingPlan) {
      setIsInQAFlow(true);
    } else if (hasActivePlan || (!isLoading && !showFloatingQuestion && !showFloatingPlan)) {
      setIsInQAFlow(false);
    }
  }, [showFloatingQuestion, showFloatingPlan, isLoading, hasActivePlan]);

  // Clear toast when plan execution starts (but not if plan approval is still showing)
  useEffect(() => {
    if (hasActivePlan && !showFloatingPlan) {
      setResponseToast(null);
      setToastCentered(false);
    }
  }, [hasActivePlan, showFloatingPlan]);

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

  // Handle sidebar resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  }, []);

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      // Min width: 300px, Max width: 800px
      setSidebarWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  // Toolbar always visible - prompt input hides itself when sidebar is open
  const showToolbar = true;

  return (
    <div className="h-screen w-screen flex overflow-hidden relative">
      {/* Main canvas area - hidden in fullscreen chat */}
      {!isFullscreenChat && (
        <div
          className="relative transition-all duration-200"
          style={{
            width: isChatOpen ? `calc(100vw - ${sidebarWidth}px)` : '100vw'
          }}
        >
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

        {/* Floating progress indicator - shown when plan active and no other floating UI */}
        {showFloatingProgress && editor && (
          <FloatingProgressIndicator
            messages={messages}
            isLoading={isLoading}
            onOpenPanel={() => setIsChatOpen(true)}
            onSubmit={handleSubmit}
            editor={editor}
            hasToast={!!responseToast}
          />
        )}

        {/* Floating UI wrapper */}
        <div className="absolute inset-0 z-[60] pointer-events-none">
          {/* Floating question card */}
          {!isChatOpen && pendingQuestion && !isLoading && (
            <div className="pointer-events-auto">
              <FloatingQuestionCard
                key={currentQuestionIndex}
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
            </div>
          )}

          {/* Floating plan approval toast */}
          {!isChatOpen && pendingPlan && !pendingQuestion && !isLoading && !dismissedPlan && (
            <div className="pointer-events-auto">
              <FloatingPlanApproval
                title={pendingPlan.title}
                onApprove={() => handleSubmit("Approved! Go ahead.", { openPanel: false })}
                onViewDetails={() => setIsChatOpen(true)}
              />
            </div>
          )}

          {/* Floating thinking indicator - hide once content starts streaming */}
          {!isChatOpen && isLoading && !hasActivePlan && (() => {
            // Hide thinking if we already have content streaming
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role === 'assistant' && lastMsg.content && lastMsg.content.trim()) {
              return null; // Content is streaming, don't show thinking
            }

            // Determine what the AI is doing based on recent tool calls
            const recentTools = lastMsg?.role === 'assistant' ? lastMsg.toolInvocations || [] : [];
            const lastSearchTool = [...recentTools].reverse().find(t => t.toolName === 'webSearch');

            let status = "Thinking...";
            if (lastSearchTool) {
              status = "Searching the web...";
            }

            return <FloatingThinkingIndicator status={status} />;
          })()}

          {/* Floating voice indicator */}
          {!isChatOpen && (voice.state === "listening" || voice.state === "speaking") && (
            <div className="pointer-events-auto">
              <FloatingVoiceIndicator state={voice.state} onEnd={handleVoiceDisconnect} />
            </div>
          )}

          {/* Centered toast */}
          {toastCentered && responseToast && !showFloatingQuestion && !isChatOpen && !shouldHideToastRef.current && (
            <div
              className={`absolute z-[65] w-[420px] ${showFloatingPlan || showFloatingProgress ? 'bottom-[188px]' : 'bottom-24'}`}
              style={{
                left: '50%',
                transform: 'translateX(-50%)'
              }}
            >
              <div className="pointer-events-auto w-full bg-white shadow-lg border border-gray-200 overflow-hidden flex flex-col max-h-[300px] relative" style={{ borderRadius: '32px' }}>
                {/* Sticky icon */}
                <div className="absolute top-4 left-4 z-10 bg-white">
                  <div className="w-6 h-6 rounded-full bg-gray-900 text-white flex items-center justify-center">
                    <IconSingleSparksFilled size="small" />
                  </div>
                </div>
                {/* Sticky close button */}
                <div className="absolute top-4 right-4 z-10">
                  <div
                    onClick={() => { setResponseToast(null); setToastCentered(false); }}
                    className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors rounded-full cursor-pointer"
                    title="Dismiss"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </div>
                </div>
                {/* Scrollable content */}
                <div
                  onClick={() => setIsChatOpen(true)}
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
            </div>
          )}
        </div>

        {/* Custom toolbar at bottom center */}
        {showToolbar && (
          <Toolbar
            editor={editor}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            isChatOpen={isChatOpen}
            hideInput={
              showFloatingQuestion || showFloatingPlan ||
              // Keep toolbar locked in canvas-tools mode during entire Q&A/plan flow
              isInQAFlow ||
              // Hide input when in voice mode
              voice.isConnected
            }
            onSubmit={handleSubmit}
            isLoading={isLoading}
            voiceState={voice.state}
            onVoiceToggle={handleVoiceToggle}
            onExpandedChange={setIsToolbarExpanded}
            responseToast={isChatOpen || toastCentered || showFloatingQuestion || shouldHideToastRef.current ? null : responseToast}
            onDismissToast={() => { setResponseToast(null); setToastCentered(false); }}
            onOpenChat={() => setIsChatOpen(true)}
            hasMessages={messages.length > 0}
            canvasState={getCanvasState()}
            canvasWidth={isChatOpen && typeof window !== 'undefined' ? window.innerWidth - sidebarWidth : undefined}
          />
        )}
        </div>
      )}

      {/* Side chat panel - fixed position, outside flex flow OR fullscreen */}
      {(isChatOpen || isFullscreenChat) && (
        <div
          className={`fixed top-0 h-full z-[999] ${isFullscreenChat ? 'left-0 right-0 flex' : 'right-0 select-none'}`}
          style={isFullscreenChat ? undefined : { width: `${sidebarWidth}px` }}
        >
          {/* Resize handle (sidebar mode only) */}
          {!isFullscreenChat && (
            <div
              onMouseDown={handleResizeStart}
              className={`absolute left-0 top-0 bottom-0 w-1 hover:w-1.5 transition-all cursor-col-resize z-[1000] ${
                isResizing ? 'bg-blue-500 w-1.5' : 'bg-transparent hover:bg-gray-300'
              }`}
            />
          )}

          {isFullscreenChat ? (
            <div className="flex flex-col h-full flex-1">
              {/* Full-width header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setIsFullscreenChat(false);
                      setIsChatOpen(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Back to canvas"
                  >
                    <IconArrowLeft />
                  </button>
                  <span className="text-sm font-medium text-gray-900">Chat</span>
                  <span className="text-xs text-gray-500">with AI</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      setIsFullscreenChat(false);
                      handleCloseChat(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"
                    title="Close"
                  >
                    <IconCross />
                  </button>
                </div>
              </div>

              {/* Content area: chat + plan side by side */}
              <div className="flex flex-1 overflow-hidden relative">
                <div className="flex-1 overflow-hidden">
                  <ChatPanel
                    onClose={() => {
                      setIsFullscreenChat(false);
                      handleCloseChat(true);
                    }}
                    hideHeader={true}
                    isFullscreen={isFullscreenChat}
                    messages={messages}
                    input={input}
                    setInput={setInput}
                    onSubmit={handleSubmit}
                    isLoading={isLoading}
                    onNavigateToFrames={navigateToFrames}
                  />
                </div>

                {/* Plan progress panel or open button */}
                {activePlanDetails && isPlanPanelVisible && (
                  <PlanProgressPanel
                    plan={activePlanDetails}
                    isLoading={isLoading}
                    onToggleVisibility={() => setIsPlanPanelVisible(false)}
                  />
                )}
                {activePlanDetails && !isPlanPanelVisible && (
                  <button
                    onClick={() => setIsPlanPanelVisible(true)}
                    className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-gray-100 text-gray-500 z-10"
                    title="Show plan"
                  >
                    <IconSidebarGlobalClosed css={{ transform: 'rotate(180deg)' }} />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <ChatPanel
              onClose={() => {
                setIsFullscreenChat(false);
                handleCloseChat(true);
              }}
              onCollapse={() => {
                handleCloseChat(false);
                const lastAssistantMsg = messages.findLast(m => m.role === 'assistant' && m.content?.trim());
                if (lastAssistantMsg?.content) {
                  setResponseToast(lastAssistantMsg.content);
                  setToastCentered(true);
                  setIsToolbarExpanded(true);
                }
              }}
              onExpand={() => {
                setIsFullscreenChat(true);
              }}
              isFullscreen={false}
              messages={messages}
              input={input}
              setInput={setInput}
              onSubmit={handleSubmit}
              isLoading={isLoading}
              onNavigateToFrames={navigateToFrames}
            />
          )}
        </div>
      )}
    </div>
  );
}
