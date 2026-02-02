"use client";

import { useState, useCallback, useRef } from "react";
import type { Plan, Task } from "@/types/plan";

interface UsePlanOptions {
  onToolCall?: (toolName: string, args: Record<string, unknown>) => void;
  getCanvasState?: () => Array<Record<string, unknown>>;
}

export function usePlan({ onToolCall, getCanvasState }: UsePlanOptions = {}) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [searchStatus, setSearchStatus] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Create a new plan from a goal
  const createPlan = useCallback(async (goal: string) => {
    setIsPlanning(true);
    setPlan(null);
    setSearchStatus(null);

    try {
      abortControllerRef.current = new AbortController();

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "create_plan", goal }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "searching") {
                setSearchStatus(`Searching: ${data.query}`);
              }
              if (data.type === "search_complete") {
                setSearchStatus(null);
              }
              if (data.type === "plan_created") {
                setPlan(data.plan);
              }
              if (data.type === "error") {
                console.error("Plan error:", data.message);
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to create plan:", err);
      }
    } finally {
      setIsPlanning(false);
      setSearchStatus(null);
    }
  }, []);

  // Approve the plan and optionally start execution
  const approvePlan = useCallback((autoStart = true) => {
    if (!plan) return;

    setPlan(prev => prev ? {
      ...prev,
      status: autoStart ? 'executing' : 'paused',
      currentTaskIndex: autoStart ? 0 : -1,
    } : null);

    if (autoStart) {
      setIsPaused(false);
      // Start execution will be triggered by useEffect in component
    }
  }, [plan]);

  // Execute a single step
  const executeStep = useCallback(async (taskIndex: number) => {
    if (!plan || taskIndex >= plan.tasks.length) return;

    setIsExecuting(true);

    // Update task to running
    setPlan(prev => {
      if (!prev) return null;
      const tasks = [...prev.tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], status: 'running' };
      return { ...prev, tasks, currentTaskIndex: taskIndex };
    });

    try {
      abortControllerRef.current = new AbortController();

      const canvasState = getCanvasState?.() || [];

      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "execute_step",
          plan,
          taskIndex,
          canvasState,
        }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === "tool_call" && onToolCall) {
                onToolCall(data.toolName, data.args);
              }

              if (data.type === "task_completed") {
                setPlan(prev => {
                  if (!prev) return null;
                  const tasks = [...prev.tasks];
                  tasks[taskIndex] = data.task;
                  return { ...prev, tasks };
                });
              }

              if (data.type === "task_error") {
                setPlan(prev => {
                  if (!prev) return null;
                  const tasks = [...prev.tasks];
                  tasks[taskIndex] = data.task;
                  return { ...prev, tasks, status: 'error' };
                });
              }
            } catch { /* skip */ }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") {
        console.error("Failed to execute step:", err);
        setPlan(prev => {
          if (!prev) return null;
          const tasks = [...prev.tasks];
          tasks[taskIndex] = { ...tasks[taskIndex], status: 'error', error: String(err) };
          return { ...prev, tasks, status: 'error' };
        });
      }
    } finally {
      setIsExecuting(false);
    }
  }, [plan, onToolCall, getCanvasState]);

  // Continue to next step
  const continueExecution = useCallback(async () => {
    if (!plan) return;

    setIsPaused(false);

    const nextIndex = plan.currentTaskIndex + 1;
    if (nextIndex < plan.tasks.length) {
      setPlan(prev => prev ? { ...prev, status: 'executing', currentTaskIndex: nextIndex } : null);
      await executeStep(nextIndex);
    } else {
      setPlan(prev => prev ? { ...prev, status: 'completed' } : null);
    }
  }, [plan, executeStep]);

  // Pause execution
  const pauseExecution = useCallback(() => {
    setIsPaused(true);
    abortControllerRef.current?.abort();
    setPlan(prev => prev ? { ...prev, status: 'paused' } : null);
  }, []);

  // Run all remaining steps
  const runAll = useCallback(async () => {
    if (!plan) return;

    setIsPaused(false);

    let currentIndex = plan.currentTaskIndex >= 0 ? plan.currentTaskIndex : 0;

    while (currentIndex < plan.tasks.length && !isPaused) {
      setPlan(prev => prev ? { ...prev, status: 'executing', currentTaskIndex: currentIndex } : null);
      await executeStep(currentIndex);

      // Check if paused during execution
      if (isPaused) break;

      currentIndex++;
    }

    if (currentIndex >= plan.tasks.length) {
      setPlan(prev => prev ? { ...prev, status: 'completed' } : null);
    }
  }, [plan, isPaused, executeStep]);

  // Edit a task
  const editTask = useCallback((taskIndex: number, updates: Partial<Task>) => {
    setPlan(prev => {
      if (!prev) return null;
      const tasks = [...prev.tasks];
      tasks[taskIndex] = { ...tasks[taskIndex], ...updates };
      return { ...prev, tasks };
    });
  }, []);

  // Reset/clear plan
  const resetPlan = useCallback(() => {
    abortControllerRef.current?.abort();
    setPlan(null);
    setIsPlanning(false);
    setIsExecuting(false);
    setIsPaused(false);
    setSearchStatus(null);
  }, []);

  return {
    plan,
    isPlanning,
    isExecuting,
    isPaused,
    searchStatus,
    createPlan,
    approvePlan,
    executeStep,
    continueExecution,
    pauseExecution,
    runAll,
    editTask,
    resetPlan,
  };
}
