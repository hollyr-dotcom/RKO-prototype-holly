"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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

export function TaskRow({ task, onToggleStatus, onUpdateTitle, onDelete }: TaskRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(task.title);
  const [isHovered, setIsHovered] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
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
    setIsChecking(true);
    onToggleStatus(task.id);
    setTimeout(() => setIsChecking(false), 300);
  }, [task.id, onToggleStatus]);

  return (
    <motion.div
      variants={itemVariants}
      className="group px-3 py-2.5 hover:bg-gray-50 rounded-lg transition-colors duration-200 flex items-center gap-3"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Checkbox */}
      <motion.button
        onClick={handleCheckboxClick}
        className="flex-shrink-0 focus:outline-none"
        animate={isChecking ? { scale: [1, 1.2, 1] } : {}}
        transition={spring.snappy}
        aria-label={isComplete ? "Mark as incomplete" : "Mark as complete"}
      >
        {isComplete ? (
          <div className="w-5 h-5 rounded-full bg-blue-500 border-2 border-blue-500 flex items-center justify-center">
            <IconCheckMark css={{ width: 10, height: 10, color: "white" }} />
          </div>
        ) : (
          <div className="w-5 h-5 rounded-full border-2 border-gray-200 hover:border-gray-400 transition-colors duration-200" />
        )}
      </motion.button>

      {/* Content */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
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
          <span
            onDoubleClick={handleDoubleClick}
            className={`text-sm truncate cursor-default ${
              isComplete ? "line-through text-gray-400" : "text-gray-900"
            }`}
          >
            {task.title}
          </span>
        )}

        {!isEditing && (
          <>
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
          </>
        )}
      </div>

      {/* Hover actions */}
      <div
        className={`flex items-center gap-1 transition-opacity duration-200 ${
          isHovered && !isEditing ? "opacity-100" : "opacity-0"
        }`}
      >
        <button
          onClick={handleDoubleClick}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors duration-200"
          aria-label="Edit task"
        >
          <IconSquarePencil css={{ width: 14, height: 14 }} />
        </button>
        <button
          onClick={() => onDelete(task.id)}
          className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors duration-200"
          aria-label="Delete task"
        >
          <IconTrash css={{ width: 14, height: 14 }} />
        </button>
      </div>
    </motion.div>
  );
}
