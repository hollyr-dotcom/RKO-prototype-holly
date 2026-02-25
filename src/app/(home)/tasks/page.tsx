"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { IconChevronDown } from "@mirohq/design-system-icons";
import { useTasks, type TaskFilters as HookTaskFilters } from "@/hooks/useTasks";
import { TaskListView } from "@/components/tasks/TaskListView";
import { ChatInput } from "@/components/toolbar/ChatInput";
import { useChat } from "@/hooks/useChat";
import { spring } from "@/lib/motion";
import type { TaskPriority } from "@/types/task";

type StatusFilter = "active" | "completed" | null;
type SortOption = "due_date" | "priority" | "created_at";

// Filter options for the dropdown
const FILTER_OPTIONS = [
  { label: "All spaces", value: "space:all" },
  { label: "High priority", value: "priority:high" },
  { label: "Medium priority", value: "priority:medium" },
  { label: "Low priority", value: "priority:low" },
  { label: "Active", value: "status:active" },
  { label: "Completed", value: "status:completed" },
] as const;

export default function TasksPage() {
  const [activeSpace, setActiveSpace] = useState<string | null>(null);
  const [activePriority, setActivePriority] = useState<TaskPriority | null>(null);
  const [activeStatus, setActiveStatus] = useState<StatusFilter>(null);
  const [sort, setSort] = useState<SortOption>("due_date");
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);


  // Chat setup
  const { append, isLoading, openFullscreen, registerHandlers } = useChat();

  useEffect(() => {
    registerHandlers({
      handleToolCall: () => {},
      getCanvasState: () => ({ frames: [], orphans: [], arrows: [] }),
      getUserEdits: () => [],
    });
  }, [registerHandlers]);

  const handleSubmit = (text: string) => {
    openFullscreen(true);
    append({ role: "user", content: text });
  };

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const filters: HookTaskFilters = useMemo(
    () => ({
      spaceId: activeSpace || undefined,
      priority: activePriority || undefined,
      status: activeStatus || undefined,
      sort,
    }),
    [activeSpace, activePriority, activeStatus, sort]
  );

  const { tasks, updateTask, deleteTask } = useTasks(filters);

  // Derive unique spaces from all tasks
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

  // Build full filter list with dynamic spaces
  const allFilterOptions = useMemo(() => {
    const spaceOptions = spaces.map((s) => ({
      label: s.name,
      value: `space:${s.id}`,
    }));
    return [...FILTER_OPTIONS, ...spaceOptions];
  }, [spaces]);

  // Current active filter label
  const activeFilterLabel = activePriority
    ? `${activePriority.charAt(0).toUpperCase() + activePriority.slice(1)} priority`
    : activeStatus
      ? activeStatus === "active" ? "Active" : "Completed"
      : activeSpace
        ? spaces.find((s) => s.id === activeSpace)?.name ?? "Filtered"
        : "All tasks";

  const handleFilterSelect = useCallback(
    (value: string) => {
      const [type, key] = value.split(":");
      // Reset all filters first
      setActiveSpace(null);
      setActivePriority(null);
      setActiveStatus(null);

      if (type === "space" && key !== "all") {
        setActiveSpace(key);
      } else if (type === "priority") {
        setActivePriority(key as TaskPriority);
      } else if (type === "status") {
        setActiveStatus(key as StatusFilter);
      }
      setFilterOpen(false);
    },
    [spaces]
  );

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
    (id: string, title: string) => updateTask(id, { title }),
    [updateTask]
  );

  const handleDelete = useCallback(
    (id: string) => deleteTask(id),
    [deleteTask]
  );

  return (
    <div className="h-full w-full bg-white overflow-y-auto">
      <div className="max-w-2xl mx-auto px-6 py-10">
        {/* Heading */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
        >
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            What&apos;s on deck?
          </h1>
        </motion.div>

        {/* Filter dropdown + Sort */}
        <div className="mb-6 flex items-center gap-2">
          {/* Filter dropdown */}
          <div className="relative" ref={filterRef}>
            <button
              onClick={() => setFilterOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-600 hover:border-gray-300 hover:text-gray-800 transition-colors"
            >
              {activeFilterLabel}
              <span className="flex items-center justify-center" style={{ width: 12, height: 12 }}>
                <IconChevronDown />
              </span>
            </button>
            {filterOpen && (
              <div className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-20">
                {allFilterOptions.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => handleFilterSelect(opt.value)}
                    className="w-full text-left px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="flex-1" />

          {/* Sort dropdown */}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-500 bg-white focus:outline-none focus:border-blue-500 cursor-pointer"
          >
            <option value="due_date">Sort: Due date</option>
            <option value="priority">Sort: Priority</option>
            <option value="created_at">Sort: Created</option>
          </select>
        </div>

        {/* Task list */}
        <TaskListView
          tasks={tasks}
          onToggleStatus={handleToggleStatus}
          onUpdateTitle={handleUpdateTitle}
          onDelete={handleDelete}
        />
      </div>

      {/* Chat input — same as homepage */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70]" style={{ width: 420 }}>
        <ChatInput
          onSubmit={handleSubmit}
          onFocusChange={() => {}}
          isLoading={isLoading}
          hasMessages={false}
          hasPendingQuestion={false}
          canvasState={{ frames: [], orphans: [], arrows: [] }}
          voiceState="idle"
        />
      </div>
    </div>
  );
}
