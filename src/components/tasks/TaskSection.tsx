"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconChevronDown } from "@mirohq/design-system-icons";
import { motionTheme } from "@/lib/motion/themes";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { staggerContainer, expandCollapse } from "@/lib/motion/variants";
import { TaskRow } from "./TaskRow";
import { SortableTaskRow } from "./SortableTaskRow";
import type { TaskItem } from "@/types/task";

interface TaskSectionProps {
  title: string;
  tasks: TaskItem[];
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  sortable?: boolean;
  onToggleStatus: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onDelete: (id: string) => void;
}

const containerVariants = staggerContainer(motionTheme);
const collapseVariants = expandCollapse(motionTheme);

export function TaskSection({
  title,
  tasks,
  collapsible = false,
  defaultCollapsed = false,
  sortable = false,
  onToggleStatus,
  onUpdateTitle,
  onDelete,
}: TaskSectionProps) {
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  if (tasks.length === 0) return null;

  return (
    <div className="mb-4">
      {/* Section header */}
      <button
        onClick={collapsible ? () => setIsCollapsed(!isCollapsed) : undefined}
        className={`flex items-center gap-1.5 mb-2 ${
          collapsible ? "cursor-pointer hover:opacity-80" : "cursor-default"
        }`}
        disabled={!collapsible}
      >
        {collapsible && (
          <motion.span
            animate={{ rotate: isCollapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            className="text-gray-400"
          >
            <IconChevronDown css={{ width: 14, height: 14 }} />
          </motion.span>
        )}
        <h3 className="text-sm font-semibold text-gray-900">
          {title} ({tasks.length})
        </h3>
      </button>

      {/* Task rows */}
      <AnimatePresence initial={false}>
        {!isCollapsed && (
          <motion.div
            variants={collapseVariants}
            initial={collapsible ? "collapsed" : undefined}
            animate="expanded"
            exit="collapsed"
            style={{ overflow: "hidden" }}
          >
            {sortable ? (
              <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
                {tasks.map((task) => (
                  <SortableTaskRow
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onUpdateTitle={onUpdateTitle}
                    onDelete={onDelete}
                  />
                ))}
              </SortableContext>
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {tasks.map((task) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    onToggleStatus={onToggleStatus}
                    onUpdateTitle={onUpdateTitle}
                    onDelete={onDelete}
                  />
                ))}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
