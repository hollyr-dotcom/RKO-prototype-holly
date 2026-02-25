"use client";

import { useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import { IconCheckBoxLines } from "@mirohq/design-system-icons";
import { motionTheme } from "@/lib/motion/themes";
import { fadeIn } from "@/lib/motion/variants";
import { TaskSection } from "./TaskSection";
import type { TaskItem } from "@/types/task";

interface TaskListViewProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const fadeVariants = fadeIn(motionTheme);

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function categorizeTasks(tasks: TaskItem[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const overdue: TaskItem[] = [];
  const todayTasks: TaskItem[] = [];
  const upcoming: TaskItem[] = [];

  for (const task of tasks) {
    if (!task.dueDate) {
      upcoming.push(task);
      continue;
    }

    const dueDate = new Date(task.dueDate);
    const dueDay = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

    if (dueDay < today) {
      overdue.push(task);
    } else if (isSameDay(dueDay, today)) {
      todayTasks.push(task);
    } else {
      upcoming.push(task);
    }
  }

  return { overdue, today: todayTasks, upcoming };
}

export function TaskListView({
  tasks,
  onToggleStatus,
  onUpdateTitle,
  onDelete,
}: TaskListViewProps) {
  const sections = useMemo(() => categorizeTasks(tasks), [tasks]);

  const handleToggle = useCallback(
    (id: string) => onToggleStatus(id),
    [onToggleStatus]
  );

  const handleUpdateTitle = useCallback(
    (id: string, title: string) => onUpdateTitle(id, title),
    [onUpdateTitle]
  );

  const handleDelete = useCallback(
    (id: string) => onDelete(id),
    [onDelete]
  );

  // Empty state
  if (tasks.length === 0) {
    return (
      <motion.div
        variants={fadeVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col items-center justify-center py-24 text-center"
      >
        <div className="mb-4 text-gray-200">
          <IconCheckBoxLines css={{ width: 48, height: 48 }} />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks yet</h3>
        <p className="text-sm text-gray-400">
          Add your first task above to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div>
      <TaskSection
        title="Overdue"
        tasks={sections.overdue}
        onToggleStatus={handleToggle}
        onUpdateTitle={handleUpdateTitle}
        onDelete={handleDelete}
      />
      <TaskSection
        title="Today"
        tasks={sections.today}
        onToggleStatus={handleToggle}
        onUpdateTitle={handleUpdateTitle}
        onDelete={handleDelete}
      />
      <TaskSection
        title="Upcoming"
        tasks={sections.upcoming}
        onToggleStatus={handleToggle}
        onUpdateTitle={handleUpdateTitle}
        onDelete={handleDelete}
      />
    </div>
  );
}
