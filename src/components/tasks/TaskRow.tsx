"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IconCheckMark, IconSquarePencil, IconTrash } from "@mirohq/design-system-icons";
import { spring } from "@/lib/motion/tokens";
import { motionTheme } from "@/lib/motion/themes";
import { staggerItem } from "@/lib/motion/variants";
import type { TaskItem } from "@/types/task";

interface TaskRowProps {
  task: TaskItem;
  onToggleStatus: (id: string) => void;
  onUpdateTitle: (id: string, title: string) => void;
  onDelete: (id: string) => void;
  dragHandleProps?: Record<string, unknown>;
}

const itemVariants = staggerItem(motionTheme);

function PriorityBadge({ priority }: { priority: TaskItem["priority"] }) {
  const styles = {
    high: "bg-red-500/10 text-red-500",
    medium: "bg-yellow-500/10 text-yellow-500",
    low: "bg-gray-100 text-gray-400",
  };

  return (
    <span className={`text-xs rounded px-1.5 py-0.5 font-medium ${styles[priority]}`}>
      {priority.charAt(0).toUpperCase() + priority.slice(1)}
    </span>
  );
}

function formatDueDate(dueDate: string | null): { label: string; isOverdue: boolean } {
  if (!dueDate) return { label: "", isOverdue: false };

  const due = new Date(dueDate);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const dueDay = new Date(due.getFullYear(), due.getMonth(), due.getDate());
  const diffDays = Math.round((dueDay.getTime() - today.getTime()) / 86400000);

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, isOverdue: true };
  if (diffDays === 0) return { label: "Due today", isOverdue: false };
  if (diffDays === 1) return { label: "Due tomorrow", isOverdue: false };
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    isOverdue: false,
  };
}

export function TaskRow({ task, onToggleStatus, onUpdateTitle, onDelete, dragHandleProps }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isComplete = task.status === "complete";
  const dueInfo = formatDueDate(task.dueDate);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleDoubleClick = useCallback(() => {
    if (!isComplete) {
      setEditValue(task.title);
      setIsEditing(true);
    }
  }, [isComplete, task.title]);

  const handleEditSubmit = useCallback(() => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== task.title) {
      onUpdateTitle(task.id, trimmed);
    } else {
      setEditValue(task.title);
    }
    setIsEditing(false);
  }, [editValue, task.title, task.id, onUpdateTitle]);

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") {
        handleEditSubmit();
      } else if (e.key === "Escape") {
        setEditValue(task.title);
        setIsEditing(false);
      }
    },
    [handleEditSubmit, task.title]
  );

  const handleCheckboxClick = useCallback(() => {
    onToggleStatus(task.id);
  }, [task.id, onToggleStatus]);

  const Wrapper = dragHandleProps ? "div" : motion.div;
  const wrapperProps = dragHandleProps
    ? {}
    : { variants: itemVariants };

  return (
    <Wrapper
      {...wrapperProps}
      {...(dragHandleProps ?? {})}
      className={`group px-3 py-2.5 hover:bg-gray-50 border-b border-gray-100 transition-colors duration-200 flex items-center gap-3${dragHandleProps ? " cursor-grab active:cursor-grabbing" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <button
        onClick={handleCheckboxClick}
        className="relative flex-shrink-0 w-6 h-6 focus:outline-none"
        aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
      >
        {/* Empty circle base */}
        <div className="absolute inset-0 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200" />
        {/* Blue filled circle — animates in/out */}
        <AnimatePresence>
          {isComplete && (
            <motion.div
              className="absolute inset-0 rounded-full bg-blue-500 flex items-center justify-center"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              transition={spring.snappy}
            >
              <motion.span
                className="flex items-center justify-center"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ ...spring.snappy, delay: 0.05 }}
              >
                <IconCheckMark css={{ width: 12, height: 12, color: "white" }} />
              </motion.span>
            </motion.div>
          )}
        </AnimatePresence>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {isEditing ? (
          <input
            ref={inputRef}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleEditSubmit}
            onKeyDown={handleEditKeyDown}
            className="flex-1 text-sm text-gray-900 bg-transparent border-b border-blue-500 outline-none py-0"
          />
        ) : (
          <>
            <span className="relative inline-flex items-center truncate">
              <motion.span
                onDoubleClick={handleDoubleClick}
                className="truncate cursor-default text-base"
                animate={{ color: isComplete ? "var(--color-gray-400)" : "var(--color-gray-900)" }}
                transition={{ duration: 0.3 }}
              >
                {task.title}
              </motion.span>
              {/* Animated strikethrough line */}
              <motion.span
                className="absolute left-0 right-0 h-px bg-gray-400 pointer-events-none"
                style={{ top: "50%" }}
                initial={false}
                animate={{ scaleX: isComplete ? 1 : 0, originX: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              />
            </span>
            <div className="flex items-center gap-2 mt-1">
              <PriorityBadge priority={task.priority} />
              {task.spaceName && (
                <span className="text-xs text-gray-400 truncate">{task.spaceName}</span>
              )}
              {dueInfo.label && (
                <span
                  className={`text-xs ${
                    dueInfo.isOverdue ? "text-red-500" : "text-gray-400"
                  }`}
                >
                  {dueInfo.label}
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hover actions */}
      <div
        className={`flex items-center gap-0.5 transition-opacity duration-200 ${
          isHovered && !isEditing ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={handleDoubleClick}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors duration-200"
          aria-label="Edit task"
        >
          <IconSquarePencil css={{ width: 20, height: 20 }} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-red-500 transition-colors duration-200"
          aria-label="Delete task"
        >
          <IconTrash css={{ width: 20, height: 20 }} />
        </button>
      </div>
    </Wrapper>
  );
}
