"use client";

import { useState, useMemo, useCallback } from "react";
import { motion } from "framer-motion";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { IconCheckBoxLines } from "@mirohq/design-system-icons";
import { motionTheme } from "@/lib/motion/themes";
import { fadeIn } from "@/lib/motion/variants";
import { TaskSection } from "./TaskSection";
import { TaskRow } from "./TaskRow";
import type { TaskItem } from "@/types/task";

interface TaskListViewProps {
  tasks: TaskItem[];
  onToggleStatus: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  onReorder?: (taskIds: string[]) => void;
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

type SectionKey = "overdue" | "today" | "upcoming";

export function TaskListView({
  tasks,
  onToggleStatus,
  onUpdateTitle,
  onDelete,
  onReorder,
}: TaskListViewProps) {
  const sections = useMemo(() => categorizeTasks(tasks), [tasks]);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  const findSection = useCallback(
    (id: string): SectionKey | null => {
      if (sections.overdue.some((t) => t.id === id)) return "overdue";
      if (sections.today.some((t) => t.id === id)) return "today";
      if (sections.upcoming.some((t) => t.id === id)) return "upcoming";
      return null;
    },
    [sections]
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      if (!over || active.id === over.id) return;

      const activeSection = findSection(active.id as string);
      const overSection = findSection(over.id as string);

      // Only reorder within same section
      if (!activeSection || !overSection || activeSection !== overSection) return;

      const sectionTasks = sections[activeSection];
      const oldIndex = sectionTasks.findIndex((t) => t.id === active.id);
      const newIndex = sectionTasks.findIndex((t) => t.id === over.id);
      if (oldIndex === newIndex) return;

      const reordered = arrayMove(sectionTasks, oldIndex, newIndex);

      const allIds = [
        ...(activeSection === "overdue" ? reordered : sections.overdue),
        ...(activeSection === "today" ? reordered : sections.today),
        ...(activeSection === "upcoming" ? reordered : sections.upcoming),
      ].map((t) => t.id);

      onReorder?.(allIds);
    },
    [sections, findSection, onReorder]
  );

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

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

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
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div>
        <TaskSection
          title="Overdue"
          tasks={sections.overdue}
          sortable
          onToggleStatus={handleToggle}
          onUpdateTitle={handleUpdateTitle}
          onDelete={handleDelete}
        />
        <TaskSection
          title="Today"
          tasks={sections.today}
          sortable
          onToggleStatus={handleToggle}
          onUpdateTitle={handleUpdateTitle}
          onDelete={handleDelete}
        />
        <TaskSection
          title="Upcoming"
          tasks={sections.upcoming}
          sortable
          onToggleStatus={handleToggle}
          onUpdateTitle={handleUpdateTitle}
          onDelete={handleDelete}
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div
            style={{
              background: "white",
              borderRadius: 8,
              boxShadow: "0 12px 28px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)",
              transform: "rotate(1deg) scale(1.02)",
            }}
          >
            <TaskRow
              task={activeTask}
              onToggleStatus={() => {}}
              onUpdateTitle={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
