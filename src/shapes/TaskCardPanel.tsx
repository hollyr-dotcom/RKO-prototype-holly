"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCross,
  IconPlus,
  IconChevronDown,
  IconSelect,
  IconUser,
  IconCalendarBlank,
  IconTag,
  IconBoxLinesTextarea,
  IconCheckBoxLines,
} from "@mirohq/design-system-icons";
import type { Editor, TLShapeId } from "tldraw";

// ── Data Types ──

interface TaskCardData {
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  tags: string[];
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
}

// ── Options ──

interface SelectOpt {
  value: string;
  label: string;
  color: string;
}

const STATUS_OPTIONS: SelectOpt[] = [
  { value: "not_started", label: "Not Started", color: "#6B7280" },
  { value: "in_progress", label: "In Progress", color: "#F59E0B" },
  { value: "complete", label: "Complete", color: "#10B981" },
];

const PRIORITY_OPTIONS: SelectOpt[] = [
  { value: "low", label: "Low", color: "#6B7280" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

const LABEL_OPTIONS = [
  { value: "Bug", color: "#EF4444" },
  { value: "Feature", color: "#3B82F6" },
  { value: "Design", color: "#8B5CF6" },
  { value: "Frontend", color: "#F59E0B" },
  { value: "Backend", color: "#10B981" },
  { value: "Infra", color: "#6366F1" },
  { value: "Docs", color: "#EC4899" },
  { value: "Performance", color: "#14B8A6" },
];

interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  { id: "u-1", name: "Mark B", initials: "MB", avatarColor: "#4262FF" },
  { id: "u-2", name: "Alice S", initials: "AS", avatarColor: "#C8B6FF" },
  { id: "u-3", name: "Jun L", initials: "JL", avatarColor: "#B8F077" },
  { id: "u-4", name: "Ravi N", initials: "RN", avatarColor: "#F48FB1" },
  { id: "u-5", name: "Kate R", initials: "KR", avatarColor: "#FFD02F" },
  { id: "u-6", name: "Tom P", initials: "TP", avatarColor: "#80DEEA" },
];

// ── Helpers ──

function getTagColor(tag: string): string {
  const known = LABEL_OPTIONS.find((o) => o.value === tag);
  if (known) return known.color;
  const colors = ["#EF4444", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#6366F1", "#EC4899", "#14B8A6"];
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  return colors[Math.abs(hash) % colors.length];
}

function getAvatarInfo(name: string): { initials: string; color: string } {
  const member = TEAM_MEMBERS.find((m) => m.name === name);
  if (member) return { initials: member.initials, color: member.avatarColor };
  const parts = name.trim().split(/\s+/);
  const initials = parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase();
  const colors = ["#4262FF", "#C8B6FF", "#B8F077", "#F48FB1", "#FFD02F", "#80DEEA"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return { initials, color: colors[Math.abs(hash) % colors.length] };
}

function extractProps(raw: Record<string, unknown>): TaskCardData {
  return {
    title: (raw.title as string) || "",
    description: (raw.description as string) || "",
    status: (raw.status as string) || "not_started",
    priority: (raw.priority as string) || "medium",
    assignee: (raw.assignee as string) || "",
    dueDate: (raw.dueDate as string) || "",
    tags: (raw.tags as string[]) || [],
    subtasks: (raw.subtasks as TaskCardData["subtasks"]) || [],
  };
}

// ── Separator ──

function Separator() {
  return <div style={{ height: 1, backgroundColor: "#e5e7eb", width: "100%" }} />;
}

// ── InlineDropdown ──

function InlineDropdown<T>({
  trigger,
  items,
  renderItem,
  onSelect,
  align = "left",
}: {
  trigger: React.ReactNode;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  onSelect: (item: T) => void;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        onPointerDown={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: 14,
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: "#111827",
          width: "100%",
        }}
        className="task-sidebar-hover-bg"
      >
        {trigger}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              zIndex: 50,
              marginTop: 4,
              minWidth: 160,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              overflow: "hidden",
              ...(align === "right" ? { right: 0 } : { left: 0 }),
            }}
          >
            {items.map((item, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  onSelect(item);
                  setOpen(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "#111827",
                }}
                className="task-sidebar-hover-bg"
              >
                {renderItem(item)}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Value Editors ──

function SelectValue({
  value,
  options,
  onChange,
}: {
  value: string;
  options: SelectOpt[];
  onChange: (v: string) => void;
}) {
  const current = options.find((o) => o.value === value);
  return (
    <InlineDropdown<SelectOpt>
      trigger={
        current ? (
          <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                backgroundColor: current.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontSize: 14 }}>{current.label}</span>
          </span>
        ) : (
          <span style={{ fontSize: 14, color: "#9CA3AF" }}>Empty</span>
        )
      }
      items={options}
      renderItem={(opt) => (
        <>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              backgroundColor: opt.color,
              flexShrink: 0,
            }}
          />
          <span>{opt.label}</span>
        </>
      )}
      onSelect={(opt) => onChange(opt.value)}
    />
  );
}

function MultiSelectValue({
  values,
  onChange,
}: {
  values: string[];
  onChange: (v: string[]) => void;
}) {
  const available = LABEL_OPTIONS.filter((o) => !values.includes(o.value));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4, padding: "4px 8px" }}>
      {values.map((v) => {
        const color = getTagColor(v);
        return (
          <span
            key={v}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              borderRadius: 9999,
              padding: "2px 8px",
              fontSize: 10,
              fontWeight: 600,
              backgroundColor: `${color}20`,
              color: color,
            }}
          >
            {v}
            <button
              type="button"
              onClick={() => onChange(values.filter((x) => x !== v))}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 0,
                display: "flex",
                borderRadius: "50%",
                color: "inherit",
                opacity: 0.7,
              }}
            >
              <IconCross css={{ width: 10, height: 10 }} />
            </button>
          </span>
        );
      })}
      {available.length > 0 && (
        <InlineDropdown<{ value: string; color: string }>
          trigger={<IconPlus css={{ width: 12, height: 12, color: "#9CA3AF" }} />}
          items={available}
          renderItem={(opt) => (
            <>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: opt.color,
                  flexShrink: 0,
                }}
              />
              <span>{opt.value}</span>
            </>
          )}
          onSelect={(opt) => onChange([...values, opt.value])}
        />
      )}
      {values.length === 0 && available.length > 0 && (
        <InlineDropdown<{ value: string; color: string }>
          trigger={<span style={{ fontSize: 14, color: "#9CA3AF" }}>Empty</span>}
          items={available}
          renderItem={(opt) => (
            <>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  backgroundColor: opt.color,
                  flexShrink: 0,
                }}
              />
              <span>{opt.value}</span>
            </>
          )}
          onSelect={(opt) => onChange([opt.value])}
        />
      )}
    </div>
  );
}

function PersonValue({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const avatarInfo = value ? getAvatarInfo(value) : null;

  return (
    <InlineDropdown<TeamMember | null>
      trigger={
        value && avatarInfo ? (
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: avatarInfo.color,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {avatarInfo.initials}
            </span>
            <span style={{ fontSize: 14 }}>{value}</span>
          </span>
        ) : (
          <span style={{ display: "flex", alignItems: "center", gap: 8, color: "#9CA3AF" }}>
            <IconUser css={{ width: 16, height: 16 }} />
            <span style={{ fontSize: 14 }}>Empty</span>
          </span>
        )
      }
      items={[null, ...TEAM_MEMBERS]}
      renderItem={(m) =>
        m ? (
          <>
            <span
              style={{
                width: 20,
                height: 20,
                borderRadius: "50%",
                backgroundColor: m.avatarColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 8,
                fontWeight: 700,
                color: "white",
                flexShrink: 0,
              }}
            >
              {m.initials}
            </span>
            <span>{m.name}</span>
          </>
        ) : (
          <span style={{ color: "#9CA3AF" }}>Unassigned</span>
        )
      }
      onSelect={(m) => onChange(m ? m.name : "")}
    />
  );
}

// ── Property Row ──

function PropertyRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "flex-start",
      }}
      className="task-sidebar-hover-bg"
    >
      <div
        style={{
          width: 140,
          flexShrink: 0,
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
        }}
      >
        <span style={{ color: "#9CA3AF", flexShrink: 0, display: "flex" }}>{icon}</span>
        <span
          style={{
            fontSize: 14,
            color: "#9CA3AF",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </span>
      </div>
      <div style={{ flex: 1, minWidth: 0, paddingTop: 2, paddingBottom: 2 }}>{children}</div>
    </div>
  );
}

// ── Subtask Section ──

function SubtaskSection({
  subtasks,
  onUpdate,
}: {
  subtasks: TaskCardData["subtasks"];
  onUpdate: (subtasks: TaskCardData["subtasks"]) => void;
}) {
  const [newInput, setNewInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = () => {
    const trimmed = newInput.trim();
    if (!trimmed) return;
    onUpdate([...subtasks, { id: `st-${Date.now()}`, title: trimmed, completed: false }]);
    setNewInput("");
    inputRef.current?.focus();
  };

  const completedCount = subtasks.filter((s) => s.completed).length;

  return (
    <div style={{ padding: "12px 16px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <span style={{ color: "#9CA3AF", display: "flex" }}>
          <IconCheckBoxLines css={{ width: 16, height: 16 }} />
        </span>
        <span style={{ fontSize: 14, color: "#9CA3AF" }}>
          Subtasks{subtasks.length > 0 ? ` (${completedCount}/${subtasks.length})` : ""}
        </span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 24 }}>
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}
          >
            <input
              type="checkbox"
              checked={subtask.completed}
              onChange={() =>
                onUpdate(subtasks.map((s) => (s.id === subtask.id ? { ...s, completed: !s.completed } : s)))
              }
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: 16,
                height: 16,
                cursor: "pointer",
                flexShrink: 0,
                accentColor: "#10B981",
              }}
            />
            <input
              type="text"
              defaultValue={subtask.title}
              onBlur={(e) => {
                const val = e.target.value.trim();
                if (val && val !== subtask.title) {
                  onUpdate(subtasks.map((s) => (s.id === subtask.id ? { ...s, title: val } : s)));
                }
              }}
              onPointerDown={(e) => e.stopPropagation()}
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
              onClick={() => onUpdate(subtasks.filter((s) => s.id !== subtask.id))}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                border: "none",
                background: "none",
                cursor: "pointer",
                padding: 2,
                color: "#9CA3AF",
                display: "flex",
                flexShrink: 0,
                opacity: 0.5,
              }}
              className="task-sidebar-hover-opacity"
            >
              <IconCross css={{ width: 12, height: 12 }} />
            </button>
          </div>
        ))}
        <div style={{ display: "flex", alignItems: "center", gap: 8, paddingTop: 4 }}>
          <input
            ref={inputRef}
            type="text"
            value={newInput}
            onChange={(e) => setNewInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
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
            onClick={handleAdd}
            onPointerDown={(e) => e.stopPropagation()}
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
    </div>
  );
}

// ── Main Sidebar ──

export interface TaskCardSidebarProps {
  isOpen: boolean;
  shapeId: string | null;
  editor: Editor | null;
  onClose: () => void;
}

// ── Focus Panel (lightbox) ──

export interface TaskCardFocusPanelProps {
  shapeId: string;
  editor: Editor;
}

export function TaskCardFocusPanel({ shapeId, editor }: TaskCardFocusPanelProps) {
  const [localProps, setLocalProps] = useState<TaskCardData | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // Initialize from editor
  useEffect(() => {
    if (!shapeId || !editor) {
      setLocalProps(null);
      return;
    }
    const shape = editor.getShape(shapeId as TLShapeId);
    if (shape && (shape.type as string) === "taskcard") {
      const p = extractProps(shape.props as Record<string, unknown>);
      setLocalProps(p);
      setTitleDraft(p.title);
    }
  }, [shapeId, editor]);

  // Update handler: sync local state + push to editor
  const handleUpdate = useCallback(
    (updates: Partial<TaskCardData>) => {
      if (!editor || !shapeId) return;
      setLocalProps((prev) => (prev ? { ...prev, ...updates } : prev));
      const shape = editor.getShape(shapeId as TLShapeId);
      if (shape) {
        editor.updateShape({
          id: shape.id,
          type: "taskcard" as string,
          props: { ...(shape.props as Record<string, unknown>), ...updates },
        } as any);
      }
    },
    [editor, shapeId]
  );

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed && localProps && trimmed !== localProps.title) {
      handleUpdate({ title: trimmed });
    }
  }, [titleDraft, localProps, handleUpdate]);

  const iconSize = { width: 16, height: 16 };

  if (!localProps) return null;

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <style>{`
        .task-sidebar-hover-bg:hover { background-color: rgba(0,0,0,0.03); }
        .task-sidebar-hover-opacity:hover { opacity: 1 !important; }
      `}</style>
      <div
        style={{
          width: "100%",
          padding: "20px 20px 8px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Title */}
        <input
          value={titleDraft}
          onChange={(e) => setTitleDraft(e.target.value)}
          onBlur={commitTitle}
          onKeyDown={(e) => {
            if (e.key === "Enter") e.currentTarget.blur();
          }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            background: "transparent",
            fontSize: 17,
            fontWeight: 600,
            color: "#111827",
            border: "none",
            outline: "none",
            padding: 0,
            marginBottom: 16,
            width: "100%",
            paddingRight: 32,
          }}
        />

        <Separator />

        {/* Property rows */}
        <div style={{ paddingTop: 4, paddingBottom: 4 }}>
          <PropertyRow icon={<IconSelect css={iconSize} />} label="Status">
            <SelectValue
              value={localProps.status}
              options={STATUS_OPTIONS}
              onChange={(v) => handleUpdate({ status: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconSelect css={iconSize} />} label="Priority">
            <SelectValue
              value={localProps.priority}
              options={PRIORITY_OPTIONS}
              onChange={(v) => handleUpdate({ priority: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconUser css={iconSize} />} label="Assignee">
            <PersonValue
              value={localProps.assignee}
              onChange={(v) => handleUpdate({ assignee: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconCalendarBlank css={iconSize} />} label="Due Date">
            <input
              type="date"
              defaultValue={localProps.dueDate}
              onChange={(e) => handleUpdate({ dueDate: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: localProps.dueDate ? "#111827" : "#9CA3AF",
                padding: "4px 8px",
                borderRadius: 4,
                cursor: "pointer",
              }}
              className="task-sidebar-hover-bg"
            />
          </PropertyRow>

          <PropertyRow icon={<IconTag css={iconSize} />} label="Labels">
            <MultiSelectValue
              values={localProps.tags}
              onChange={(v) => handleUpdate({ tags: v })}
            />
          </PropertyRow>
        </div>

        <Separator />

        {/* Description */}
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "#9CA3AF", display: "flex" }}>
              <IconBoxLinesTextarea css={iconSize} />
            </span>
            <span style={{ fontSize: 14, color: "#9CA3AF" }}>Description</span>
          </div>
          <textarea
            defaultValue={localProps.description}
            onBlur={(e) => handleUpdate({ description: e.target.value })}
            onPointerDown={(e) => e.stopPropagation()}
            placeholder="Add a description..."
            rows={4}
            style={{
              width: "100%",
              resize: "vertical",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#111827",
              background: "transparent",
              padding: "4px 8px",
              borderRadius: 4,
              minHeight: 80,
              fontFamily: "inherit",
              lineHeight: "20px",
              marginLeft: 16,
              boxSizing: "border-box",
            }}
          />
        </div>

        <Separator />

        {/* Subtasks */}
        <SubtaskSection
          subtasks={localProps.subtasks}
          onUpdate={(subtasks) => handleUpdate({ subtasks })}
        />
      </div>
    </div>
  );
}

// ── Sidebar (unused, kept for export compatibility) ──

export function TaskCardSidebar({ isOpen, shapeId, editor, onClose }: TaskCardSidebarProps) {
  const [localProps, setLocalProps] = useState<TaskCardData | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // Initialize from editor
  useEffect(() => {
    if (!isOpen || !shapeId || !editor) {
      setLocalProps(null);
      return;
    }
    const shape = editor.getShape(shapeId as TLShapeId);
    if (shape && (shape.type as string) === "taskcard") {
      const p = extractProps(shape.props as Record<string, unknown>);
      setLocalProps(p);
      setTitleDraft(p.title);
    }
  }, [isOpen, shapeId, editor]);

  // Update handler: sync local state + push to editor
  const handleUpdate = useCallback(
    (updates: Partial<TaskCardData>) => {
      if (!editor || !shapeId) return;
      setLocalProps((prev) => (prev ? { ...prev, ...updates } : prev));
      const shape = editor.getShape(shapeId as TLShapeId);
      if (shape) {
        editor.updateShape({
          id: shape.id,
          type: "taskcard" as string,
          props: { ...(shape.props as Record<string, unknown>), ...updates },
        } as any);
      }
    },
    [editor, shapeId]
  );

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed && localProps && trimmed !== localProps.title) {
      handleUpdate({ title: trimmed });
    }
  }, [titleDraft, localProps, handleUpdate]);

  // Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handle = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener("keydown", handle, true);
    return () => window.removeEventListener("keydown", handle, true);
  }, [isOpen, onClose]);

  const iconSize = { width: 16, height: 16 };

  return (
    <AnimatePresence>
      {isOpen && localProps && (
        <motion.div
          initial={{ x: 380, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 380, opacity: 0 }}
          transition={{ type: "spring", stiffness: 350, damping: 30 }}
          onClick={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            zIndex: 40,
            width: 380,
            display: "flex",
            flexDirection: "column",
            borderLeft: "1px solid #e5e7eb",
            background: "#ffffff",
            boxShadow: "-4px 0 12px rgba(0,0,0,0.04)",
          }}
        >
          {/* Inline styles for hover states */}
          <style>{`
            .task-sidebar-hover-bg:hover { background-color: rgba(0,0,0,0.03); }
            .task-sidebar-hover-opacity:hover { opacity: 1 !important; }
          `}</style>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "16px 16px 12px" }}>
            <input
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={commitTitle}
              onKeyDown={(e) => {
                if (e.key === "Enter") e.currentTarget.blur();
              }}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                flex: 1,
                background: "transparent",
                fontSize: 16,
                fontWeight: 600,
                color: "#111827",
                border: "none",
                outline: "none",
                padding: 0,
              }}
            />
            <button
              onClick={onClose}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                flexShrink: 0,
                borderRadius: 6,
                padding: 4,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                color: "#9CA3AF",
                display: "flex",
              }}
              className="task-sidebar-hover-bg"
            >
              <IconCross css={iconSize} />
            </button>
          </div>

          <Separator />

          {/* Scrollable content */}
          <div style={{ flex: 1, overflowY: "auto" }}>
            {/* Property rows */}
            <div style={{ paddingTop: 4, paddingBottom: 4 }}>
              {/* Status */}
              <PropertyRow icon={<IconSelect css={iconSize} />} label="Status">
                <SelectValue
                  value={localProps.status}
                  options={STATUS_OPTIONS}
                  onChange={(v) => handleUpdate({ status: v })}
                />
              </PropertyRow>

              {/* Priority */}
              <PropertyRow icon={<IconSelect css={iconSize} />} label="Priority">
                <SelectValue
                  value={localProps.priority}
                  options={PRIORITY_OPTIONS}
                  onChange={(v) => handleUpdate({ priority: v })}
                />
              </PropertyRow>

              {/* Assignee */}
              <PropertyRow icon={<IconUser css={iconSize} />} label="Assignee">
                <PersonValue
                  value={localProps.assignee}
                  onChange={(v) => handleUpdate({ assignee: v })}
                />
              </PropertyRow>

              {/* Due Date */}
              <PropertyRow icon={<IconCalendarBlank css={iconSize} />} label="Due Date">
                <input
                  type="date"
                  defaultValue={localProps.dueDate}
                  onChange={(e) => handleUpdate({ dueDate: e.target.value })}
                  onPointerDown={(e) => e.stopPropagation()}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    fontSize: 14,
                    color: localProps.dueDate ? "#111827" : "#9CA3AF",
                    padding: "4px 8px",
                    borderRadius: 4,
                    cursor: "pointer",
                  }}
                  className="task-sidebar-hover-bg"
                />
              </PropertyRow>

              {/* Labels (tags) */}
              <PropertyRow icon={<IconTag css={iconSize} />} label="Labels">
                <MultiSelectValue
                  values={localProps.tags}
                  onChange={(v) => handleUpdate({ tags: v })}
                />
              </PropertyRow>
            </div>

            <Separator />

            {/* Description */}
            <div style={{ padding: "12px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ color: "#9CA3AF", display: "flex" }}>
                  <IconBoxLinesTextarea css={iconSize} />
                </span>
                <span style={{ fontSize: 14, color: "#9CA3AF" }}>Description</span>
              </div>
              <textarea
                defaultValue={localProps.description}
                onBlur={(e) => handleUpdate({ description: e.target.value })}
                onPointerDown={(e) => e.stopPropagation()}
                placeholder="Add a description..."
                rows={3}
                style={{
                  width: "100%",
                  resize: "vertical",
                  border: "none",
                  outline: "none",
                  fontSize: 14,
                  color: "#111827",
                  background: "transparent",
                  padding: "4px 8px",
                  borderRadius: 4,
                  minHeight: 60,
                  fontFamily: "inherit",
                  lineHeight: "20px",
                  marginLeft: 16,
                  boxSizing: "border-box",
                }}
              />
            </div>

            <Separator />

            {/* Subtasks */}
            <SubtaskSection
              subtasks={localProps.subtasks}
              onUpdate={(subtasks) => handleUpdate({ subtasks })}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
