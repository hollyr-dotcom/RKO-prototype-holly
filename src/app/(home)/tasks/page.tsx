"use client";

import { useState, useMemo, useCallback } from "react";
import { useTasks, type TaskFilters as HookTaskFilters } from "@/hooks/useTasks";
import { TaskListView } from "@/components/tasks/TaskListView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import { TaskQuickAdd } from "@/components/tasks/TaskQuickAdd";
import type { TaskPriority } from "@/types/task";

type StatusFilter = "active" | "completed" | null;
type SortOption = "due_date" | "priority" | "created_at";

export default function TasksPage() {
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<TaskPriority | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(null);
  const [sort, setSort] = useState<SortOption>("due_date");

  const filters: HookTaskFilters = useMemo(
    () => ({
      spaceId: activeSpace || undefined,
      priority: activePriority || undefined,
      status: activeStatus || undefined,
      sort,
    }),
    [activeSpace, activePriority, activeStatus, sort]
  );

  const { tasks, createTask, updateTask, deleteTask } = useTasks(filters);

  // Derive unique spaces from all tasks (unfiltered fetch)
  const { tasks: allTasks } = useTasks();
  const spaces = useMemo(() => {
    const seen = new Map<string, string>();
    for (const t of allTasks) {
      if (t.spaceId && t.spaceName && !seen.has(t.spaceId)) {
        seen.set(t.spaceId, t.spaceName);
      }
    }
    return Array.from(seen, ([id, name]) => ({ id, name }));
  }, [allTasks]);

  const handleToggleStatus = useCallback(
    (id: string) => {
      const task = tasks.find((t) => t.id === id);
      if (task) {
        updateTask(id, {
          status: task.status === "complete" ? "not_started" : "complete",
        });
      }
    },
    [tasks, updateTask]
  );

  const handleUpdateTitle = useCallback(
    (id: string, title: string) => {
      updateTask(id, { title });
    },
    [updateTask]
  );

  const handleDelete = useCallback(
    (id: string) => {
      deleteTask(id);
    },
    [deleteTask]
  );

  const handleQuickAdd = useCallback(
    (title: string) => {
      createTask({ title, spaceId: activeSpace || undefined });
    },
    [createTask, activeSpace]
  );

  const activeTasks = tasks.filter((t) => t.status !== "complete");

  return (
    <div className="h-full w-full bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Page header */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {activeTasks.length} active {activeTasks.length === 1 ? "task" : "tasks"}
          </p>
        </div>

        {/* Quick add */}
        <TaskQuickAdd onAdd={handleQuickAdd} />

        {/* Filters */}
        <div className="mb-6">
          <TaskFilters
            activeSpace={activeSpace}
            activePriority={activePriority}
            activeStatus={activeStatus}
            sort={sort}
            spaces={spaces}
            onSpaceChange={setActiveSpace}
            onPriorityChange={setActivePriority}
            onStatusChange={setActiveStatus}
            onSortChange={setSort}
          />
        </div>

        {/* Task list */}
        <TaskListView
          tasks={tasks}
          onToggleStatus={handleToggleStatus}
          onUpdateTitle={handleUpdateTitle}
          onDelete={handleDelete}
        />
      </div>
    </div>
  );
}
