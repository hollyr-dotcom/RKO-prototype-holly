"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskItem, TaskPriority, TaskStatus } from "@/types/task";

export interface TaskFilters {
  status?: "active" | "completed" | TaskStatus;
  priority?: TaskPriority;
  spaceId?: string;
  sort?: "due_date" | "priority" | "created_at";
  /** @deprecated Use `sort` instead. Kept for backward compat with UI components. */
  sortBy?: "dueDate" | "priority" | "createdAt" | "title";
}

const SORT_BY_MAP: Record<string, string> = {
  dueDate: "due_date",
  priority: "priority",
  createdAt: "created_at",
  title: "created_at",
};

function normalizeStatus(s: string): string | null {
  if (s === "active" || s === "completed") return s;
  // Map TaskStatus values to API filter values
  if (s === "complete") return "completed";
  if (s === "not_started" || s === "in_progress") return "active";
  return null;
}

function buildQueryString(filters?: TaskFilters): string {
  const params = new URLSearchParams();
  if (filters?.status) {
    const normalized = normalizeStatus(filters.status);
    if (normalized) params.set("status", normalized);
  }
  if (filters?.priority) params.set("priority", filters.priority);
  if (filters?.spaceId) params.set("space_id", filters.spaceId);
  const sort = filters?.sort || (filters?.sortBy ? SORT_BY_MAP[filters.sortBy] : undefined);
  if (sort) params.set("sort", sort);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useTasks(filters?: TaskFilters) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  const fetchTasks = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const qs = buildQueryString(filtersRef.current);
      const res = await fetch(`/api/tasks${qs}`);
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to fetch tasks");
      }
      const data = await res.json();
      setTasks(data.tasks);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [
    fetchTasks,
    filters?.status,
    filters?.priority,
    filters?.spaceId,
    filters?.sort,
    filters?.sortBy,
  ]);

  const createTask = useCallback(
    async (input: {
      title: string;
      description?: string;
      priority?: TaskPriority;
      dueDate?: string;
      spaceId?: string;
      tags?: string[];
    }) => {
      try {
        const res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to create task");
        }
        const data = await res.json();
        const newTask: TaskItem = data.task;
        setTasks((prev) => [...prev, newTask]);
        return newTask;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create task");
        return null;
      }
    },
    []
  );

  const updateTask = useCallback(
    async (
      taskId: string,
      updates: Partial<
        Pick<
          TaskItem,
          | "title"
          | "description"
          | "status"
          | "priority"
          | "dueDate"
          | "assigneeId"
          | "spaceId"
          | "canvasId"
          | "canvasShapeId"
          | "tags"
        >
      >
    ) => {
      const previousTasks = [...tasks];
      setTasks((prev) =>
        prev.map((t) =>
          t.id === taskId
            ? { ...t, ...updates, updatedAt: new Date().toISOString() }
            : t
        )
      );

      try {
        const res = await fetch(`/api/tasks/${taskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to update task");
        }
        const data = await res.json();
        const updatedTask: TaskItem = data.task;
        setTasks((prev) => prev.map((t) => (t.id === taskId ? updatedTask : t)));
        return updatedTask;
      } catch (err) {
        setTasks(previousTasks);
        setError(err instanceof Error ? err.message : "Failed to update task");
        return null;
      }
    },
    [tasks]
  );

  const deleteTask = useCallback(
    async (taskId: string) => {
      const previousTasks = [...tasks];
      setTasks((prev) => prev.filter((t) => t.id !== taskId));

      try {
        const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to delete task");
        }
        return true;
      } catch (err) {
        setTasks(previousTasks);
        setError(err instanceof Error ? err.message : "Failed to delete task");
        return false;
      }
    },
    [tasks]
  );

  const reorderTasks = useCallback(
    async (taskIds: string[]) => {
      const previousTasks = [...tasks];
      setTasks((prev) => {
        const taskMap = new Map(prev.map((t) => [t.id, t]));
        const reordered: TaskItem[] = [];
        for (let i = 0; i < taskIds.length; i++) {
          const task = taskMap.get(taskIds[i]);
          if (task) {
            reordered.push({ ...task, order: i });
          }
        }
        for (const task of prev) {
          if (!taskIds.includes(task.id)) {
            reordered.push(task);
          }
        }
        return reordered;
      });

      try {
        const res = await fetch("/api/tasks", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskIds }),
        });
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Failed to reorder tasks");
        }
        return true;
      } catch (err) {
        setTasks(previousTasks);
        setError(err instanceof Error ? err.message : "Failed to reorder tasks");
        return false;
      }
    },
    [tasks]
  );

  return { tasks, isLoading, error, createTask, updateTask, deleteTask, reorderTasks };
}
