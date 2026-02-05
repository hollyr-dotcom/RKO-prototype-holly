"use client";

import { Tldraw, Editor, createShapeId, toRichText, TLShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { useAgent, Message } from "@/hooks/useAgent";
import { useRealtimeVoice } from "@/hooks/useRealtimeVoice";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";
import { IconSingleSparksFilled, IconViewSideRight } from "@mirohq/design-system-icons";
import { calculateLayout, findEmptyCanvasSpace } from "@/lib/layoutEngine";
import type { LayoutType, LayoutItem, LayoutOptions } from "@/types/layout";

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
function FloatingThinkingIndicator() {
  return (
    <div className="absolute bottom-24 left-1/2 z-[60] animate-float-in">
      <div className="flex items-center gap-3 bg-white rounded-full px-5 py-3 shadow-lg border border-gray-200">
        <div className="flex gap-1">
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }} />
          <span className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }} />
        </div>
        <span className="text-sm text-gray-600">Thinking...</span>
      </div>
    </div>
  );
}

// Floating voice indicator
function FloatingVoiceIndicator({ state, onEnd }: { state: "listening" | "speaking"; onEnd: () => void }) {
  return (
    <div className="absolute bottom-24 left-1/2 z-[60] animate-float-in">
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
    <div className="absolute bottom-24 left-1/2 z-[60] w-[520px] animate-float-in">
      <div className="bg-white text-gray-900 rounded-2xl shadow-2xl overflow-hidden border border-gray-200">
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
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-colors ${
                    selectedIndex === i ? "bg-gray-100" : "hover:bg-gray-50"
                  }`}
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
    <div className="absolute bottom-24 left-1/2 z-[60] animate-float-in">
      <div className="flex items-center gap-3 bg-white text-gray-900 rounded-2xl shadow-lg border border-gray-200 px-4 py-3">
        {/* Icon */}
        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>

        {/* Title */}
        <span className="text-sm font-medium flex-1 truncate max-w-[280px]">
          <span className="text-gray-500">Plan:</span> {title}
        </span>

        {/* View details link */}
        <button
          onClick={onViewDetails}
          className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
        >
          Details
        </button>

        {/* Approve button */}
        <button
          onClick={onApprove}
          className="px-4 py-1.5 text-sm font-medium bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
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
  const [isChatClosing, setIsChatClosing] = useState(false);
  const [input, setInput] = useState("");
  const createdShapesRef = useRef<TLShapeId[]>([]);
  const waitingForGoodbyeRef = useRef(false);
  const goodbyeTranscriptLengthRef = useRef(0); // Track goodbye message length for audio timing
  const hasPlayedStartChimeRef = useRef(false); // Track if start chime played for this session

  // Voice mode with OpenAI Realtime API
  const voice = useRealtimeVoice();

  // Handle sidebar close with animation
  const handleCloseChat = useCallback(() => {
    setIsChatClosing(true);
    setTimeout(() => {
      setIsChatOpen(false);
      setIsChatClosing(false);
    }, 300); // Match animation duration
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

  // Capture canvas screenshot for visual context
  const captureScreenshot = useCallback(async (): Promise<string | null> => {
    if (!editor) return null;

    try {
      // Get the tldraw container element
      const container = editor.getContainer();
      const canvasElement = container.querySelector('canvas');

      if (!canvasElement) {
        console.warn('[CANVAS] No canvas element found');
        return null;
      }

      // Create a new canvas to resize and optimize the image
      const outputCanvas = document.createElement('canvas');
      const ctx = outputCanvas.getContext('2d');
      if (!ctx) return null;

      // Set reasonable dimensions (API limits)
      const maxWidth = 1280;
      const maxHeight = 720;
      const scale = Math.min(maxWidth / canvasElement.width, maxHeight / canvasElement.height, 1);

      outputCanvas.width = canvasElement.width * scale;
      outputCanvas.height = canvasElement.height * scale;

      // Draw the canvas content scaled
      ctx.drawImage(canvasElement, 0, 0, outputCanvas.width, outputCanvas.height);

      // Convert to base64 PNG
      return outputCanvas.toDataURL('image/png', 0.8);
    } catch (err) {
      console.error('[CANVAS] Screenshot capture failed:', err);
      return null;
    }
  }, [editor]);

  // Get canvas state for agent context (defined before handleToolCall)
  const getCanvasState = useCallback(() => {
    if (!editor) return [];
    const shapes = editor.getCurrentPageShapes();
    const state = shapes.map((shape) => {
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

    return state;
  }, [editor]);

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
             (s.props as { name?: string }).name?.includes(layout.replaceFrame))
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
          const layoutItems: LayoutItem[] = layout.items.map((item) => ({
            type: item.type === "sticky" ? "shape" : item.type, // Treat stickies as shapes for layout
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
          });
          createdShapesRef.current.push(frameId);

          // Create items (shapes or stickies based on original type)
          result.items.forEach(({ item, position }, index) => {
            const itemId = createShapeId();
            const itemX = canvasPos.x + position.x;
            const itemY = canvasPos.y + position.y;
            const originalItem = layout.items[index];

            if (originalItem.type === "sticky") {
              // Create sticky note
              editor.createShape({
                id: itemId,
                type: "note",
                x: itemX,
                y: itemY,
                props: {
                  richText: toRichText(item.text || ""),
                  color: colorMap[item.color || "yellow"] || "yellow",
                  size: "m",
                },
              });
            } else {
              // Create geo shape (rectangle)
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
            }
            createdShapesRef.current.push(itemId);
          });

          // Create arrows connecting parent to children
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

          return;
        }

        // For grid/flow, use tldraw native layout (dynamic)
        // Create frame FIRST at the correct position, then add shapes inside it
        const estimatedWidth = 800;
        const estimatedHeight = 600;
        const canvasPos = findEmptyCanvasSpace(editor, estimatedWidth, estimatedHeight);

        console.log('[LAYOUT] Creating grid/flow frame at', canvasPos);

        // Create frame first
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          props: {
            name: layout.frameName,
            w: estimatedWidth,
            h: estimatedHeight,
          },
        });
        createdShapesRef.current.push(frameId);

        // Create shapes INSIDE the frame with relative coordinates
        const createdIds: TLShapeId[] = [];
        const startX = 100; // Start position inside frame
        const startY = 100;

        layout.items.forEach((item, index) => {
          const itemId = createShapeId();
          // Cluster shapes tightly at start position
          const tempX = startX + (index % 3) * 30;
          const tempY = startY + Math.floor(index / 3) * 30;

          if (item.type === "sticky") {
            editor.createShape({
              id: itemId,
              type: "note",
              x: tempX,
              y: tempY,
              parentId: frameId, // Important: relative coordinates
              props: {
                richText: toRichText(item.text),
                color: colorMap[item.color || "yellow"] || "yellow",
                size: "m",
              },
            });
          } else if (item.type === "shape") {
            editor.createShape({
              id: itemId,
              type: "geo",
              x: tempX,
              y: tempY,
              parentId: frameId, // Important: relative coordinates
              props: {
                geo: "rectangle",
                w: 180,
                h: 100,
                color: colorMap[item.color || "blue"] || "blue",
                richText: toRichText(item.text || ""),
              },
            });
          }
          createdIds.push(itemId);
          createdShapesRef.current.push(itemId);
        });

        // Apply tldraw layout AFTER shapes are in frame
        const gapSize = layout.spacing === "compact" ? 30 : layout.spacing === "spacious" ? 60 : 40;

        if (layout.type === "grid") {
          editor.packShapes(createdIds, gapSize);
        } else if (layout.type === "flow") {
          editor.distributeShapes(createdIds, "horizontal");
          editor.alignShapes(createdIds, "center-vertical");
        }

        // Adjust frame size to fit packed shapes
        setTimeout(() => {
          const shapes = createdIds.map(id => editor.getShape(id)!).filter(Boolean);
          if (shapes.length === 0) return;

          // Calculate bounds relative to frame (shapes have relative coordinates)
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          shapes.forEach(shape => {
            const bounds = editor.getShapeGeometry(shape.id).bounds;
            minX = Math.min(minX, shape.x);
            minY = Math.min(minY, shape.y);
            maxX = Math.max(maxX, shape.x + bounds.width);
            maxY = Math.max(maxY, shape.y + bounds.height);
          });

          const padding = 80;
          const titleSpace = 60;

          // Update frame size to fit content
          editor.updateShape({
            id: frameId,
            type: "frame",
            props: {
              w: Math.max(maxX - minX + padding * 2, 400),
              h: Math.max(maxY - minY + padding * 2 + titleSpace, 300),
            },
          });

          console.log('[LAYOUT] Grid/flow frame created and sized');
        }, 100);

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

      // Track created shape (removed auto-zoom - was too jumpy)
      if (shapeId) {
        createdShapesRef.current.push(shapeId);
      }
    },
    [editor, findNonOverlappingPosition]
  );

  const { messages, append, isLoading, setMessages } = useAgent(handleToolCall, getCanvasState);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSubmit = useCallback(
    (text: string, options?: { openPanel?: boolean }) => {
      if (!text.trim()) return;

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

  // Find pending askUser question (unanswered)
  const pendingQuestion = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.role !== 'assistant') continue;

      const askUserTool = msg.toolInvocations?.find(t => t.toolName === 'askUser');
      if (askUserTool) {
        // Check if there's a user response after this
        const hasResponse = messages.slice(i + 1).some(m => m.role === 'user');
        if (!hasResponse) {
          return {
            question: (askUserTool.args as { question: string }).question,
            suggestions: (askUserTool.args as { suggestions: string[] }).suggestions,
          };
        }
      }
    }
    return null;
  }, [messages]);

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

  // Simple flags for what floating UI to show (only one at a time, in priority order)
  // Priority: question > plan approval > thinking > progress indicator
  // Voice and text both use the same messages-based pendingQuestion
  const showFloatingQuestion = !isChatOpen && !!pendingQuestion && !isLoading;
  // Plan only shows after loading completes (so thinking can show while processing)
  const showFloatingPlan = !isChatOpen && !!pendingPlan && !pendingQuestion && !isLoading;
  // Thinking shows when loading BUT NOT during plan execution (progress indicator handles that)
  const showFloatingThinking = !isChatOpen && isLoading && !hasActivePlan;
  const showFloatingProgress = !isChatOpen && hasActivePlan && !showFloatingQuestion && !showFloatingPlan && !showFloatingThinking;

  // Toolbar always visible - prompt input hides itself when sidebar is open
  const showToolbar = true;

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

        {/* Floating progress indicator - shown when plan active and no other floating UI */}
        {showFloatingProgress && editor && (
          <FloatingProgressIndicator
            messages={messages}
            isLoading={isLoading}
            onOpenPanel={() => setIsChatOpen(true)}
            onSubmit={handleSubmit}
            editor={editor}
          />
        )}

        {/* Floating question card */}
        {showFloatingQuestion && pendingQuestion && (
          <FloatingQuestionCard
            question={pendingQuestion.question}
            options={pendingQuestion.suggestions}
            onSelect={(answer) => handleSubmit(answer, { openPanel: false })}
            onSkip={() => handleSubmit("Skip", { openPanel: false })}
          />
        )}

        {/* Floating plan approval toast */}
        {showFloatingPlan && pendingPlan && (
          <FloatingPlanApproval
            title={pendingPlan.title}
            onApprove={() => handleSubmit("Approved! Go ahead.", { openPanel: false })}
            onViewDetails={() => setIsChatOpen(true)}
          />
        )}

        {/* Floating thinking indicator */}
        {showFloatingThinking && (
          <FloatingThinkingIndicator />
        )}

        {/* Floating voice indicator */}
        {!isChatOpen && (voice.state === "listening" || voice.state === "speaking") && (
          <FloatingVoiceIndicator state={voice.state} onEnd={handleVoiceDisconnect} />
        )}

        {/* Custom toolbar at bottom center */}
        {showToolbar && (
          <Toolbar
            editor={editor}
            onToggleChat={() => setIsChatOpen(!isChatOpen)}
            isChatOpen={isChatOpen && !isChatClosing}
            hideInput={
              showFloatingQuestion || showFloatingThinking || showFloatingPlan ||
              // Also hide during close animation if floating UI will appear after
              (isChatClosing && (!!pendingQuestion || !!pendingPlan || (isLoading && !hasActivePlan))) ||
              // Hide input when in voice mode
              voice.isConnected
            }
            onSubmit={handleSubmit}
            isLoading={isLoading}
            voiceState={voice.state}
            onVoiceToggle={handleVoiceToggle}
          />
        )}
      </div>

      {/* Side chat panel - fixed position, outside flex flow */}
      {(isChatOpen || isChatClosing) && (
        <div className={`fixed top-0 right-0 h-full w-96 z-[999] ${isChatClosing ? 'animate-slide-out-right' : 'animate-slide-in-right'}`}>
          <ChatPanel
            onClose={handleCloseChat}
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
