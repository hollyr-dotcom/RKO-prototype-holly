"use client";

import { useState } from "react";
import type { Plan, Task } from "@/types/plan";
import {
  IconSpinner,
  IconCheckMark,
  IconCross,
  IconChevronRightDouble,
  IconChevronDown,
  IconMagnifyingGlass,
} from "@mirohq/design-system-icons";

interface TaskListProps {
  plan: Plan | null;
  isPlanning: boolean;
  isExecuting: boolean;
  isPaused: boolean;
  searchStatus: string | null;
  onApprove: (autoStart?: boolean) => void;
  onContinue: () => void;
  onPause: () => void;
  onRunAll: () => void;
  onReset: () => void;
}

// Task status icon
function TaskStatusIcon({ status }: { status: Task["status"] }) {
  switch (status) {
    case "pending":
      return (
        <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
      );
    case "running":
      return (
        <div className="w-5 h-5 text-blue-500 animate-spin">
          <IconSpinner css={{ width: 20, height: 20 }} />
        </div>
      );
    case "done":
      return (
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white">
          <IconCheckMark css={{ width: 12, height: 12 }} />
        </div>
      );
    case "error":
      return (
        <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center text-white">
          <IconCross css={{ width: 12, height: 12 }} />
        </div>
      );
    case "skipped":
      return (
        <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white">
          <IconChevronRightDouble css={{ width: 12, height: 12 }} />
        </div>
      );
  }
}

// Single task item
function TaskItem({ task, isActive }: { task: Task; isActive: boolean }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`border-l-2 pl-4 py-2 transition-colors ${
        isActive
          ? "border-blue-500 bg-blue-50"
          : task.status === "done"
          ? "border-green-500"
          : task.status === "error"
          ? "border-red-500"
          : "border-gray-200"
      }`}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-3 text-left"
      >
        <TaskStatusIcon status={task.status} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${
            task.status === "done" ? "text-gray-500" : "text-gray-900"
          }`}>
            {task.index + 1}. {task.title}
          </p>
          {task.status === "running" && (
            <p className="text-xs text-blue-600 mt-0.5">Working...</p>
          )}
          {task.result && task.status === "done" && (
            <p className="text-xs text-green-600 mt-0.5">{task.result}</p>
          )}
          {task.error && (
            <p className="text-xs text-red-600 mt-0.5">{task.error}</p>
          )}
        </div>
        <span className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
          <IconChevronDown css={{ width: 16, height: 16 }} />
        </span>
      </button>

      {isExpanded && (
        <div className="mt-2 ml-8 text-xs text-gray-600">
          <p className="mb-2">{task.description}</p>
          {task.toolCalls && task.toolCalls.length > 0 && (
            <div className="mt-2 space-y-1">
              <p className="font-medium text-gray-700">Created:</p>
              {task.toolCalls.map((tc, i) => {
                const args = tc.args as Record<string, string | number | undefined>;
                return (
                  <p key={i} className="text-gray-500">
                    • {tc.toolName.replace("create", "")}
                    {args.text && `: "${String(args.text).slice(0, 30)}..."`}
                    {args.name && `: "${String(args.name)}"`}
                    {args.type && `: ${String(args.type)}`}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function TaskList({
  plan,
  isPlanning,
  isExecuting,
  isPaused,
  searchStatus,
  onApprove,
  onContinue,
  onPause,
  onRunAll,
  onReset,
}: TaskListProps) {
  // Planning state
  if (isPlanning) {
    return (
      <div className="p-4">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-blue-500 animate-spin">
            <IconSpinner css={{ width: 20, height: 20 }} />
          </span>
          <span className="text-sm font-medium text-gray-900">Creating plan...</span>
        </div>
        {searchStatus && (
          <div className="flex items-center gap-2 py-2 px-3 bg-blue-50 rounded-lg text-sm text-blue-700">
            <span className="animate-pulse">
              <IconMagnifyingGlass css={{ width: 16, height: 16 }} />
            </span>
            {searchStatus}
          </div>
        )}
      </div>
    );
  }

  // No plan yet
  if (!plan) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        <p>No active plan</p>
        <p className="text-xs mt-1">Type a goal in the chat to create one</p>
      </div>
    );
  }

  // Calculate progress
  const completedTasks = plan.tasks.filter(t => t.status === "done").length;
  const progress = (completedTasks / plan.tasks.length) * 100;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Plan</h3>
          <button
            onClick={onReset}
            className="text-xs text-gray-500 hover:text-gray-700"
          >
            Clear
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">{plan.goal}</p>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {completedTasks} of {plan.tasks.length} steps complete
        </p>
      </div>

      {/* Task list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {plan.tasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            isActive={plan.currentTaskIndex === task.index && plan.status === "executing"}
          />
        ))}
      </div>

      {/* Action buttons */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        {plan.status === "awaiting_approval" && (
          <>
            <button
              onClick={() => onApprove(true)}
              className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Approve & Start
            </button>
            <button
              onClick={() => onApprove(false)}
              className="w-full py-2 px-4 bg-white border border-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Approve (Manual Start)
            </button>
          </>
        )}

        {plan.status === "executing" && (
          <button
            onClick={onPause}
            disabled={!isExecuting}
            className="w-full py-2 px-4 bg-yellow-500 text-white text-sm font-medium rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
          >
            Pause
          </button>
        )}

        {plan.status === "paused" && (
          <div className="flex gap-2">
            <button
              onClick={onContinue}
              className="flex-1 py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Next Step
            </button>
            <button
              onClick={onRunAll}
              className="flex-1 py-2 px-4 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              Run All
            </button>
          </div>
        )}

        {plan.status === "completed" && (
          <div className="text-center py-2">
            <span className="text-sm text-green-600 font-medium">✓ Plan completed!</span>
          </div>
        )}

        {plan.status === "error" && (
          <div className="space-y-2">
            <div className="text-center py-2">
              <span className="text-sm text-red-600 font-medium">Error occurred</span>
            </div>
            <button
              onClick={onContinue}
              className="w-full py-2 px-4 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
            >
              Retry / Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
