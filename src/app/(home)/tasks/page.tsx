"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { IconChevronDown } from "@mirohq/design-system-icons";
import { useTasks, type TaskFilters as HookTaskFilters } from "@/hooks/useTasks";
import { TaskListView } from "@/components/tasks/TaskListView";
import { WorkspaceSidebar } from "@/components/tasks/WorkspaceSidebar";
import { ChatInput } from "@/components/toolbar/ChatInput";
import { useChat } from "@/hooks/useChat";
import { spring } from "@/lib/motion";
import type { TaskPriority } from "@/types/task";

type StatusFilter = "active" | "completed" | null;
type SortOption = "due_date" | "priority" | "created_at";

// Filter options — priority & status only (spaces are in sidebar)
const FILTER_OPTIONS = [
  { label: "All", value: "all" },
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

  const { tasks, updateTask, deleteTask, reorderTasks } = useTasks(filters);

  // Derive unique spaces and counts from all tasks
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

  const taskCountBySpace = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const t of allTasks) {
      if (t.spaceId) {
        counts[t.spaceId] = (counts[t.spaceId] ?? 0) + 1;
      }
    }
    return counts;
  }, [allTasks]);

  // Active filter label (priority/status only now)
  const activeFilterLabel = activePriority
    ? `${activePriority.charAt(0).toUpperCase() + activePriority.slice(1)} priority`
    : activeStatus
      ? activeStatus === "active" ? "Active" : "Completed"
      : "All";

  const handleFilterSelect = useCallback(
    (value: string) => {
      setActivePriority(null);
      setActiveStatus(null);

      if (value === "all") {
        // Reset
      } else {
        const [type, key] = value.split(":");
        if (type === "priority") {
          setActivePriority(key as TaskPriority);
        } else if (type === "status") {
          setActiveStatus(key as StatusFilter);
        }
      }
      setFilterOpen(false);
    },
    []
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

  const handleReorder = useCallback(
    (taskIds: string[]) => reorderTasks(taskIds),
    [reorderTasks]
  );

  return (
    <div className="h-full w-full bg-white overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Heading */}
        <motion.div
          className="mb-8"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring.gentle}
        >
          <h1 className="text-5xl font-bold tracking-tight text-zinc-900">
            What's on deck?
          </h1>
        </motion.div>

        <div className="flex gap-12">
          {/* Workspace sidebar */}
          <WorkspaceSidebar
            spaces={spaces}
            activeSpaceId={activeSpace}
            taskCountBySpace={taskCountBySpace}
            totalCount={allTasks.length}
            onSpaceSelect={setActiveSpace}
          />

          {/* Main task column */}
          <div className="flex-1 max-w-2xl">
            {/* Filter dropdown + Sort */}
          <div className="mb-6 flex items-center gap-2 justify-end hidden">
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
                  {FILTER_OPTIONS.map((opt) => (
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
            onReorder={handleReorder}
          />
          </div>
        </div>
      </div>

      {/* Chat input */}
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
