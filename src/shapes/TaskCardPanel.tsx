"use client";

import { useState, useCallback, useRef } from "react";

export interface TaskCardData {
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "complete";
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;
  tags: string[];
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
}

export interface TaskCardPanelProps {
  shapeId: string;
  title: string;
  description: string;
  status: "not_started" | "in_progress" | "complete";
  priority: "low" | "medium" | "high";
  assignee: string;
  dueDate: string;
  tags: string[];
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  onUpdate: (updates: Partial<TaskCardData>) => void;
  onClose: () => void;
}

const STATUS_OPTIONS: Array<{ value: TaskCardData["status"]; label: string; color: string }> = [
  { value: "not_started", label: "Not Started", color: "#D6D6D6" },
  { value: "in_progress", label: "In Progress", color: "#A0C4FB" },
  { value: "complete", label: "Complete", color: "#79E49B" },
];

const PRIORITY_OPTIONS: Array<{ value: TaskCardData["priority"]; label: string; color: string }> = [
  { value: "low", label: "Low", color: "#A0C4FB" },
  { value: "medium", label: "Medium", color: "#FFED7B" },
  { value: "high", label: "High", color: "#FFADAD" },
];

export function TaskCardPanel({
  title,
  description,
  status,
  priority,
  assignee,
  dueDate,
  tags,
  subtasks,
  onUpdate,
  onClose,
}: TaskCardPanelProps) {
  const [newTagInput, setNewTagInput] = useState("");
  const [newSubtaskInput, setNewSubtaskInput] = useState("");
  const subtaskInputRef = useRef<HTMLInputElement>(null);

  const handleAddTag = useCallback(() => {
    const trimmed = newTagInput.trim();
    if (!trimmed) return;
    onUpdate({ tags: [...tags, trimmed] });
    setNewTagInput("");
  }, [newTagInput, tags, onUpdate]);

  const handleRemoveTag = useCallback(
    (index: number) => {
      onUpdate({ tags: tags.filter((_, i) => i !== index) });
    },
    [tags, onUpdate]
  );

  const handleAddSubtask = useCallback(() => {
    const trimmed = newSubtaskInput.trim();
    if (!trimmed) return;
    const newSubtask = {
      id: `st-${Date.now()}`,
      title: trimmed,
      completed: false,
    };
    onUpdate({ subtasks: [...subtasks, newSubtask] });
    setNewSubtaskInput("");
    subtaskInputRef.current?.focus();
  }, [newSubtaskInput, subtasks, onUpdate]);

  const handleToggleSubtask = useCallback(
    (id: string) => {
      onUpdate({
        subtasks: subtasks.map((s) =>
          s.id === id ? { ...s, completed: !s.completed } : s
        ),
      });
    },
    [subtasks, onUpdate]
  );

  const handleDeleteSubtask = useCallback(
    (id: string) => {
      onUpdate({ subtasks: subtasks.filter((s) => s.id !== id) });
    },
    [subtasks, onUpdate]
  );

  const handleSubtaskTitleChange = useCallback(
    (id: string, newTitle: string) => {
      onUpdate({
        subtasks: subtasks.map((s) =>
          s.id === id ? { ...s, title: newTitle } : s
        ),
      });
    },
    [subtasks, onUpdate]
  );

  return (
    <div
      style={{
        background: "#ffffff",
        height: "100%",
        overflow: "auto",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
    >
      {/* Header with close button */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
        <input
          type="text"
          value={title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Task title"
          style={{
            fontSize: 20,
            fontWeight: 600,
            color: "#111827",
            border: "none",
            outline: "none",
            background: "transparent",
            width: "100%",
            padding: 0,
            lineHeight: "28px",
          }}
        />
        <button
          onClick={onClose}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            border: "1px solid #e5e7eb",
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            flexShrink: 0,
            marginLeft: 8,
            fontSize: 14,
            color: "#9CA3AF",
          }}
        >
          ✕
        </button>
      </div>

      {/* Status */}
      <FieldSection label="Status">
        <select
          value={status}
          onChange={(e) => onUpdate({ status: e.target.value as TaskCardData["status"] })}
          style={selectStyle}
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ status: opt.value })}
              style={{
                padding: "2px 8px",
                borderRadius: 4,
                border: status === opt.value ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                background: status === opt.value ? opt.color : "transparent",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                color: "#111827",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </FieldSection>

      {/* Priority */}
      <FieldSection label="Priority">
        <div style={{ display: "flex", gap: 4 }}>
          {PRIORITY_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onUpdate({ priority: opt.value })}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                padding: "4px 10px",
                borderRadius: 4,
                border: priority === opt.value ? `2px solid ${opt.color}` : "1px solid #e5e7eb",
                background: priority === opt.value ? opt.color : "transparent",
                fontSize: 12,
                fontWeight: 500,
                cursor: "pointer",
                color: "#111827",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: opt.color,
                }}
              />
              {opt.label}
            </button>
          ))}
        </div>
      </FieldSection>

      {/* Assignee */}
      <FieldSection label="Assignee">
        <input
          type="text"
          value={assignee}
          onChange={(e) => onUpdate({ assignee: e.target.value })}
          placeholder="Unassigned"
          style={inputStyle}
        />
      </FieldSection>

      {/* Due Date */}
      <FieldSection label="Due Date">
        <input
          type="date"
          value={dueDate}
          onChange={(e) => onUpdate({ dueDate: e.target.value })}
          style={inputStyle}
        />
      </FieldSection>

      {/* Tags */}
      <FieldSection label="Tags">
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {tags.map((tag, i) => (
            <span
              key={i}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                padding: "2px 8px",
                borderRadius: 4,
                background: "#F3F4F6",
                color: "#4B5563",
                fontSize: 12,
                fontWeight: 500,
              }}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(i)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 12,
                  color: "#9CA3AF",
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </span>
          ))}
          <input
            type="text"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddTag();
              }
            }}
            placeholder="Add tag..."
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: 12,
              color: "#111827",
              padding: "2px 4px",
              minWidth: 60,
            }}
          />
        </div>
      </FieldSection>

      {/* Description */}
      <FieldSection label="Description">
        <textarea
          value={description}
          onChange={(e) => onUpdate({ description: e.target.value })}
          placeholder="Add a description..."
          rows={4}
          style={{
            ...inputStyle,
            resize: "vertical",
            minHeight: 80,
            fontFamily: "inherit",
            lineHeight: "20px",
          }}
        />
      </FieldSection>

      {/* Subtasks */}
      <FieldSection label={`Subtasks${subtasks.length > 0 ? ` (${subtasks.filter((s) => s.completed).length}/${subtasks.length})` : ""}`}>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {subtasks.map((subtask) => (
            <div
              key={subtask.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "4px 0",
              }}
            >
              <input
                type="checkbox"
                checked={subtask.completed}
                onChange={() => handleToggleSubtask(subtask.id)}
                style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0, accentColor: "#79E49B" }}
              />
              <input
                type="text"
                value={subtask.title}
                onChange={(e) => handleSubtaskTitleChange(subtask.id, e.target.value)}
                style={{
                  flex: 1,
                  border: "none",
                  outline: "none",
                  background: "transparent",
                  fontSize: 14,
                  color: subtask.completed ? "#9CA3AF" : "#111827",
                  textDecoration: subtask.completed ? "line-through" : "none",
                  padding: "2px 0",
                }}
              />
              <button
                onClick={() => handleDeleteSubtask(subtask.id)}
                style={{
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  padding: 2,
                  fontSize: 12,
                  color: "#9CA3AF",
                  lineHeight: 1,
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
            <input
              ref={subtaskInputRef}
              type="text"
              value={newSubtaskInput}
              onChange={(e) => setNewSubtaskInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddSubtask();
                }
              }}
              placeholder="Add subtask..."
              style={{
                flex: 1,
                border: "1px solid #e5e7eb",
                borderRadius: 6,
                padding: "6px 10px",
                fontSize: 14,
                color: "#111827",
                outline: "none",
              }}
            />
            <button
              onClick={handleAddSubtask}
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #e5e7eb",
                background: "#F9FAFB",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
                color: "#4B5563",
                whiteSpace: "nowrap",
              }}
            >
              Add
            </button>
          </div>
        </div>
      </FieldSection>
    </div>
  );
}

// --- Shared styles ---

const inputStyle: React.CSSProperties = {
  width: "100%",
  border: "1px solid #e5e7eb",
  borderRadius: 6,
  padding: "8px 12px",
  fontSize: 14,
  color: "#111827",
  outline: "none",
  background: "#ffffff",
};

const selectStyle: React.CSSProperties = {
  ...inputStyle,
  display: "none", // hidden in favor of button group
};

// --- Field section layout ---

function FieldSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <label
        style={{
          fontSize: 14,
          fontWeight: 500,
          color: "#9CA3AF",
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}
