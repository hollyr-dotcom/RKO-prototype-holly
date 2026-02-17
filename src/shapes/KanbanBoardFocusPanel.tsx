"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  DndContext,
  DragOverlay as DndDragOverlay,
  pointerWithin,
  rectIntersection,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  type CollisionDetection,
  type DragStartEvent,
  type DragOverEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import {
  IconCross,
  IconPlus,
  IconSelect,
  IconUser,
  IconCalendarBlank,
  IconTag,
  IconBoxLinesTextarea,
  IconCheckBoxLines,
} from "@mirohq/design-system-icons";
import type { Editor as TLEditor, TLShapeId } from "tldraw";
import type { KanbanLane, KanbanCard, TeamMember, SelectOpt } from "./KanbanBoardShapeUtil";
import {
  KANBANBOARD_SHAPE_TYPE,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  LABEL_OPTIONS,
  TEAM_MEMBERS,
  getTagColor,
  getAvatarInfo,
  STATUS_MAPPING_TO_VALUE,
} from "./KanbanBoardShapeUtil";

// ── Shared UI Components ──

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
        className="kanban-hover-bg"
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
              zIndex: 100,
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
                className="kanban-hover-bg"
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
      {available.length > 0 && values.length > 0 && (
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
      style={{ display: "flex", alignItems: "flex-start" }}
      className="kanban-hover-bg"
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

function SubtaskSection({
  subtasks,
  onUpdate,
}: {
  subtasks: KanbanCard["subtasks"];
  onUpdate: (subtasks: KanbanCard["subtasks"]) => void;
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
              style={{ width: 16, height: 16, cursor: "pointer", flexShrink: 0, accentColor: "#10B981" }}
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
              className="kanban-hover-opacity"
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

// ── DnD Components ──

function DroppableLane({
  lane,
  laneCards,
  cardsByLane,
  selectedCardId,
  onCardClick,
  onAddCard,
  onRenameLane,
  onDeleteLane,
  canDelete,
}: {
  lane: KanbanLane;
  laneCards: KanbanCard[];
  cardsByLane: Record<string, string[]>;
  selectedCardId: string | null;
  onCardClick: (cardId: string) => void;
  onAddCard: () => void;
  onRenameLane: (title: string) => void;
  onDeleteLane: () => void;
  canDelete: boolean;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: lane.id });
  const [isEditing, setIsEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState(lane.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleDraft(lane.title);
  }, [lane.title]);

  useEffect(() => {
    if (isEditing) inputRef.current?.focus();
  }, [isEditing]);

  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  const commitTitle = useCallback(() => {
    setIsEditing(false);
    if (titleDraft.trim() && titleDraft !== lane.title) {
      onRenameLane(titleDraft.trim());
    } else {
      setTitleDraft(lane.title);
    }
  }, [titleDraft, lane.title, onRenameLane]);

  const laneCardIds = cardsByLane[lane.id] ?? [];

  return (
    <div
      style={{
        minWidth: 280,
        maxWidth: 280,
        flexShrink: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Lane header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          padding: "0 4px",
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            backgroundColor: lane.color,
            flexShrink: 0,
          }}
        />
        {isEditing ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleDraft(lane.title);
                setIsEditing(false);
              }
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              border: "none",
              outline: "none",
              background: "transparent",
              padding: "2px 4px",
              borderRadius: 4,
              boxShadow: "0 0 0 1px #3B82F6",
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              flex: 1,
              textAlign: "left",
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {lane.title}
          </button>
        )}

        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: "#9CA3AF",
            backgroundColor: "#f3f4f6",
            borderRadius: 9999,
            padding: "2px 8px",
            flexShrink: 0,
          }}
        >
          {laneCards.length}
        </span>

        {/* Menu button */}
        <div ref={menuRef} style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowMenu(!showMenu)}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              width: 24,
              height: 24,
              borderRadius: 4,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#9CA3AF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 14,
            }}
            className="kanban-hover-bg"
          >
            ···
          </button>
          {showMenu && canDelete && (
            <div
              style={{
                position: "absolute",
                right: 0,
                top: "100%",
                zIndex: 60,
                marginTop: 4,
                minWidth: 140,
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                background: "white",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                padding: 4,
              }}
            >
              <button
                type="button"
                onClick={() => {
                  onDeleteLane();
                  setShowMenu(false);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  display: "flex",
                  width: "100%",
                  alignItems: "center",
                  gap: 8,
                  padding: "6px 12px",
                  fontSize: 12,
                  color: "#EF4444",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  borderRadius: 4,
                }}
                className="kanban-hover-bg"
              >
                Delete lane
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Card container (droppable) */}
      <div
        ref={setNodeRef}
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRadius: 12,
          border: isOver ? "1px solid rgba(59,130,246,0.3)" : "1px solid #e5e7eb",
          background: isOver ? "rgba(59,130,246,0.04)" : "#f9fafb",
          padding: 10,
          transition: "background 0.15s, border-color 0.15s",
          minHeight: 100,
        }}
      >
        <SortableContext items={laneCardIds} strategy={verticalListSortingStrategy}>
          {laneCards.map((card) => (
            <SortableCard
              key={card.id}
              card={card}
              isSelected={selectedCardId === card.id}
              onClick={() => onCardClick(card.id)}
            />
          ))}
        </SortableContext>

        {laneCards.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "24px 0",
              fontSize: 12,
              color: "#9CA3AF",
              fontStyle: "italic",
            }}
          >
            Drop cards here
          </div>
        )}

        <button
          type="button"
          onClick={onAddCard}
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "6px 10px",
            borderRadius: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            fontSize: 12,
            color: "#9CA3AF",
          }}
          className="kanban-hover-bg"
        >
          <IconPlus css={{ width: 14, height: 14 }} />
          Add card
        </button>
      </div>
    </div>
  );
}

function SortableCard({
  card,
  isSelected,
  onClick,
}: {
  card: KanbanCard;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const statusOpt = STATUS_OPTIONS.find((o) => o.value === card.status);
  const avatarInfo = card.assignee ? getAvatarInfo(card.assignee) : null;
  const visibleTags = card.tags.slice(0, 3);
  const overflowCount = card.tags.length - 3;

  return (
    <div
      ref={setNodeRef}
      style={{
        ...style,
        background: "#ffffff",
        border: isSelected ? "2px solid #3B82F6" : "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        cursor: "grab",
        boxShadow: isSelected
          ? "0 4px 12px rgba(59,130,246,0.15)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
      }}
      {...attributes}
      {...listeners}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
    >
      {/* Card title */}
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#111827",
          lineHeight: "18px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {card.title}
      </div>

      {/* Card metadata row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          {statusOpt && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: `${statusOpt.color}20`,
                color: statusOpt.color,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: statusOpt.color,
                }}
              />
              {statusOpt.label}
            </span>
          )}
          {visibleTags.map((tag) => {
            const color = getTagColor(tag);
            return (
              <span
                key={tag}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  borderRadius: 9999,
                  padding: "2px 6px",
                  fontSize: 9,
                  fontWeight: 600,
                  backgroundColor: `${color}20`,
                  color: color,
                }}
              >
                {tag}
              </span>
            );
          })}
          {overflowCount > 0 && (
            <span style={{ fontSize: 9, fontWeight: 500, color: "#9CA3AF" }}>+{overflowCount}</span>
          )}
        </div>

        {avatarInfo ? (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: avatarInfo.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
            title={card.assignee}
          >
            {avatarInfo.initials}
          </div>
        ) : (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1px dashed #d1d5db",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}

function DragOverlayCard({ card }: { card: KanbanCard }) {
  const statusOpt = STATUS_OPTIONS.find((o) => o.value === card.status);
  const avatarInfo = card.assignee ? getAvatarInfo(card.assignee) : null;

  return (
    <div
      style={{
        width: 268,
        background: "#ffffff",
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        cursor: "grabbing",
        boxShadow: "0 12px 28px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)",
        transform: "rotate(2deg) scale(1.03)",
      }}
    >
      <div
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: "#111827",
          lineHeight: "18px",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {card.title}
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: 8,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 4 }}>
          {statusOpt && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                borderRadius: 9999,
                padding: "2px 8px",
                fontSize: 10,
                fontWeight: 600,
                backgroundColor: `${statusOpt.color}20`,
                color: statusOpt.color,
              }}
            >
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  backgroundColor: statusOpt.color,
                }}
              />
              {statusOpt.label}
            </span>
          )}
        </div>
        {avatarInfo ? (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: avatarInfo.color,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 9,
              fontWeight: 700,
              color: "white",
              flexShrink: 0,
            }}
          >
            {avatarInfo.initials}
          </div>
        ) : (
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              border: "1px dashed #d1d5db",
              flexShrink: 0,
            }}
          />
        )}
      </div>
    </div>
  );
}

// ── Card Detail Editor ──

function CardDetailEditor({
  card,
  onUpdate,
  onClose,
}: {
  card: KanbanCard;
  onUpdate: (updates: Partial<KanbanCard>) => void;
  onClose: () => void;
}) {
  const [titleDraft, setTitleDraft] = useState(card.title);
  const iconSize = { width: 16, height: 16 };

  useEffect(() => {
    setTitleDraft(card.title);
  }, [card.title]);

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed && trimmed !== card.title) {
      onUpdate({ title: trimmed });
    }
  }, [titleDraft, card.title, onUpdate]);

  return (
    <div
      style={{
        width: 360,
        flexShrink: 0,
        borderLeft: "1px solid #e5e7eb",
        background: "#ffffff",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        overflow: "hidden",
      }}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: 8,
          padding: "16px 16px 12px",
        }}
      >
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
          className="kanban-hover-bg"
        >
          <IconCross css={iconSize} />
        </button>
      </div>

      <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        <div style={{ paddingTop: 4, paddingBottom: 4 }}>
          <PropertyRow icon={<IconSelect css={iconSize} />} label="Status">
            <SelectValue
              value={card.status}
              options={STATUS_OPTIONS}
              onChange={(v) => onUpdate({ status: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconSelect css={iconSize} />} label="Priority">
            <SelectValue
              value={card.priority}
              options={PRIORITY_OPTIONS}
              onChange={(v) => onUpdate({ priority: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconUser css={iconSize} />} label="Assignee">
            <PersonValue
              value={card.assignee}
              onChange={(v) => onUpdate({ assignee: v })}
            />
          </PropertyRow>

          <PropertyRow icon={<IconCalendarBlank css={iconSize} />} label="Due Date">
            <input
              type="date"
              defaultValue={card.dueDate}
              onChange={(e) => onUpdate({ dueDate: e.target.value })}
              onPointerDown={(e) => e.stopPropagation()}
              style={{
                width: "100%",
                background: "transparent",
                border: "none",
                outline: "none",
                fontSize: 14,
                color: card.dueDate ? "#111827" : "#9CA3AF",
                padding: "4px 8px",
                borderRadius: 4,
                cursor: "pointer",
              }}
              className="kanban-hover-bg"
            />
          </PropertyRow>

          <PropertyRow icon={<IconTag css={iconSize} />} label="Labels">
            <MultiSelectValue
              values={card.tags}
              onChange={(v) => onUpdate({ tags: v })}
            />
          </PropertyRow>
        </div>

        <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />

        {/* Description */}
        <div style={{ padding: "12px 16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <span style={{ color: "#9CA3AF", display: "flex" }}>
              <IconBoxLinesTextarea css={iconSize} />
            </span>
            <span style={{ fontSize: 14, color: "#9CA3AF" }}>Description</span>
          </div>
          <textarea
            defaultValue={card.description}
            onBlur={(e) => onUpdate({ description: e.target.value })}
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

        <div style={{ height: 1, backgroundColor: "#e5e7eb" }} />

        {/* Subtasks */}
        <SubtaskSection
          subtasks={card.subtasks}
          onUpdate={(subtasks) => onUpdate({ subtasks })}
        />
      </div>
    </div>
  );
}

// ── Main Focus Panel ──

interface KanbanBoardFocusPanelProps {
  shapeId: string;
  editor: TLEditor;
}

export function KanbanBoardFocusPanel({ shapeId, editor }: KanbanBoardFocusPanelProps) {
  const [localLanes, setLocalLanes] = useState<KanbanLane[]>([]);
  const [localCards, setLocalCards] = useState<KanbanCard[]>([]);
  const [localCardsByLane, setLocalCardsByLane] = useState<Record<string, string[]>>({});
  const [titleDraft, setTitleDraft] = useState("");
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Initialize from shape
  useEffect(() => {
    const shape = editor.getShape(shapeId as TLShapeId);
    if (!shape) return;
    const props = shape.props as Record<string, unknown>;
    setLocalLanes((props.lanes as KanbanLane[]) ?? []);
    setLocalCards((props.cards as KanbanCard[]) ?? []);
    setLocalCardsByLane((props.cardsByLane as Record<string, string[]>) ?? {});
    setTitleDraft((props.title as string) ?? "Kanban Board");
  }, [shapeId, editor]);

  // Sync changes back to shape
  const syncToShape = useCallback(
    (updates: Partial<{ title: string; lanes: KanbanLane[]; cards: KanbanCard[]; cardsByLane: Record<string, string[]> }>) => {
      const shape = editor.getShape(shapeId as TLShapeId);
      if (!shape) return;
      editor.updateShape({
        id: shape.id,
        type: KANBANBOARD_SHAPE_TYPE,
        props: { ...(shape.props as Record<string, unknown>), ...updates },
      } as any);
    },
    [editor, shapeId],
  );

  // Derived
  const cardsById = useMemo(() => {
    const map = new Map<string, KanbanCard>();
    localCards.forEach((c) => map.set(c.id, c));
    return map;
  }, [localCards]);

  const laneIds = useMemo(() => new Set(localLanes.map((l) => l.id)), [localLanes]);

  const activeCard = activeId ? (cardsById.get(activeId) ?? null) : null;
  const selectedCard = selectedCardId ? (cardsById.get(selectedCardId) ?? null) : null;

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  // Collision detection: pointer-within first, fallback to rect intersection
  const collisionDetection: CollisionDetection = useCallback((args) => {
    const pointerCollisions = pointerWithin(args);
    if (pointerCollisions.length > 0) return pointerCollisions;
    return rectIntersection(args);
  }, []);

  const findLaneForCard = useCallback(
    (cardId: string): string | null => {
      for (const [laneId, cardIds] of Object.entries(localCardsByLane)) {
        if (cardIds.includes(cardId)) return laneId;
      }
      return null;
    },
    [localCardsByLane],
  );

  const resolveOverLane = useCallback(
    (overId: string): string | null => {
      if (laneIds.has(overId)) return overId;
      return findLaneForCard(overId);
    },
    [laneIds, findLaneForCard],
  );

  // Card status update when moving between lanes
  const updateCardStatusForLane = useCallback(
    (cardId: string, toLaneId: string, currentCards: KanbanCard[]): KanbanCard[] => {
      const targetLane = localLanes.find((l) => l.id === toLaneId);
      if (!targetLane || !targetLane.statusMapping) return currentCards;
      const newStatus = STATUS_MAPPING_TO_VALUE[targetLane.statusMapping];
      if (!newStatus) return currentCards;
      return currentCards.map((c) => (c.id === cardId ? { ...c, status: newStatus } : c));
    },
    [localLanes],
  );

  const handleMoveCard = useCallback(
    (taskId: string, toLaneId: string, newIndex: number) => {
      setLocalCardsByLane((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter((id) => id !== taskId);
        }
        const targetCards = [...(next[toLaneId] ?? [])];
        targetCards.splice(newIndex, 0, taskId);
        next[toLaneId] = targetCards;
        return next;
      });

      setLocalCards((prev) => {
        const updated = updateCardStatusForLane(taskId, toLaneId, prev);
        // Defer sync since we also update cardsByLane
        return updated;
      });
    },
    [updateCardStatusForLane],
  );

  const handleReorderInLane = useCallback(
    (laneId: string, oldIndex: number, newIndex: number) => {
      setLocalCardsByLane((prev) => {
        const cards = [...(prev[laneId] ?? [])];
        const [moved] = cards.splice(oldIndex, 1);
        cards.splice(newIndex, 0, moved);
        return { ...prev, [laneId]: cards };
      });
    },
    [],
  );

  // DnD handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  }, []);

  const handleDragOver = useCallback(
    (event: DragOverEvent) => {
      const { active, over } = event;
      if (!over) return;

      const activeCardId = active.id as string;
      const overId = over.id as string;

      const activeLane = findLaneForCard(activeCardId);
      const overLane = resolveOverLane(overId);

      if (!activeLane || !overLane || activeLane === overLane) return;

      const overCards = localCardsByLane[overLane] ?? [];
      const overIndex = overCards.indexOf(overId);
      const newIndex = overIndex >= 0 ? overIndex : overCards.length;

      handleMoveCard(activeCardId, overLane, newIndex);
    },
    [localCardsByLane, findLaneForCard, resolveOverLane, handleMoveCard],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);

      if (!over) return;

      const activeCardId = active.id as string;
      const overId = over.id as string;

      if (activeCardId === overId) return;

      const activeLane = findLaneForCard(activeCardId);
      const overLane = resolveOverLane(overId);

      if (!activeLane || !overLane) return;

      if (activeLane !== overLane) {
        const overCards = localCardsByLane[overLane] ?? [];
        const overIndex = overCards.indexOf(overId);
        const newIndex = overIndex >= 0 ? overIndex : overCards.length;
        handleMoveCard(activeCardId, overLane, newIndex);
      } else {
        if (laneIds.has(overId)) return;
        const cards = localCardsByLane[activeLane];
        const oldIndex = cards.indexOf(activeCardId);
        const newIndex = cards.indexOf(overId);
        if (oldIndex >= 0 && newIndex >= 0 && oldIndex !== newIndex) {
          handleReorderInLane(activeLane, oldIndex, newIndex);
        }
      }

      // Sync everything to shape after drag completes
      // Use a microtask so state updates have flushed
      setTimeout(() => {
        const shape = editor.getShape(shapeId as TLShapeId);
        if (!shape) return;
        // Read from latest state via refs would be ideal, but we can re-read
        // The state updates are batched, so we force a sync
      }, 0);
    },
    [localCardsByLane, findLaneForCard, resolveOverLane, laneIds, handleMoveCard, handleReorderInLane, editor, shapeId],
  );

  // Sync to shape whenever local state changes (debounced)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      syncToShape({
        lanes: localLanes,
        cards: localCards,
        cardsByLane: localCardsByLane,
      });
    }, 100);
    return () => {
      if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    };
  }, [localLanes, localCards, localCardsByLane, syncToShape]);

  // Board actions
  const handleAddCard = useCallback(
    (laneId: string) => {
      const lane = localLanes.find((l) => l.id === laneId);
      const statusMapping = lane?.statusMapping ?? "";
      const newStatus = STATUS_MAPPING_TO_VALUE[statusMapping] ?? "not_started";
      const newCard: KanbanCard = {
        id: `kb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        title: "New task",
        description: "",
        status: newStatus,
        priority: "medium",
        assignee: "",
        dueDate: "",
        tags: [],
        subtasks: [],
      };

      setLocalCards((prev) => [...prev, newCard]);
      setLocalCardsByLane((prev) => ({
        ...prev,
        [laneId]: [...(prev[laneId] ?? []), newCard.id],
      }));
      setSelectedCardId(newCard.id);
    },
    [localLanes],
  );

  const handleAddLane = useCallback(() => {
    const newLane: KanbanLane = {
      id: `lane-${Date.now()}`,
      title: "New Lane",
      color: "#6B7280",
      statusMapping: "",
    };
    setLocalLanes((prev) => [...prev, newLane]);
    setLocalCardsByLane((prev) => ({ ...prev, [newLane.id]: [] }));
  }, []);

  const handleRenameLane = useCallback((laneId: string, title: string) => {
    setLocalLanes((prev) => prev.map((l) => (l.id === laneId ? { ...l, title } : l)));
  }, []);

  const handleDeleteLane = useCallback(
    (laneId: string) => {
      setLocalLanes((prev) => {
        const remaining = prev.filter((l) => l.id !== laneId);
        if (remaining.length === 0) return prev;

        setLocalCardsByLane((prevCards) => {
          const orphanCards = prevCards[laneId] ?? [];
          const firstLaneId = remaining[0].id;
          const next = { ...prevCards };
          delete next[laneId];
          next[firstLaneId] = [...(next[firstLaneId] ?? []), ...orphanCards];
          return next;
        });

        return remaining;
      });
    },
    [],
  );

  const handleUpdateCard = useCallback(
    (cardId: string, updates: Partial<KanbanCard>) => {
      setLocalCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, ...updates } : c)));
    },
    [],
  );

  const handleCardClick = useCallback((cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (trimmed) {
      syncToShape({ title: trimmed });
    }
  }, [titleDraft, syncToShape]);

  if (localLanes.length === 0 && localCards.length === 0) {
    // Still loading
    return null;
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
      }}
    >
      <style>{`
        .kanban-hover-bg:hover { background-color: rgba(0,0,0,0.03); }
        .kanban-hover-opacity:hover { opacity: 1 !important; }
      `}</style>

      {/* Title bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
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
      </div>

      {/* Board content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Board area */}
        <div
          style={{
            flex: 1,
            overflow: "auto",
          }}
        >
          <DndContext
            sensors={sensors}
            collisionDetection={collisionDetection}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div
              style={{
                display: "flex",
                gap: 16,
                padding: 20,
                height: "100%",
                alignItems: "flex-start",
              }}
            >
              {localLanes.map((lane) => {
                const laneCardIds = localCardsByLane[lane.id] ?? [];
                const laneCards = laneCardIds
                  .map((id) => cardsById.get(id))
                  .filter((c): c is KanbanCard => c !== undefined);

                return (
                  <DroppableLane
                    key={lane.id}
                    lane={lane}
                    laneCards={laneCards}
                    cardsByLane={localCardsByLane}
                    selectedCardId={selectedCardId}
                    onCardClick={handleCardClick}
                    onAddCard={() => handleAddCard(lane.id)}
                    onRenameLane={(title) => handleRenameLane(lane.id, title)}
                    onDeleteLane={() => handleDeleteLane(lane.id)}
                    canDelete={localLanes.length > 1}
                  />
                );
              })}

              {/* Add lane button */}
              <button
                type="button"
                onClick={handleAddLane}
                onPointerDown={(e) => e.stopPropagation()}
                style={{
                  minWidth: 280,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  padding: "32px 24px",
                  borderRadius: 12,
                  border: "2px dashed #d1d5db",
                  background: "transparent",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "#9CA3AF",
                }}
                className="kanban-hover-bg"
              >
                <IconPlus css={{ width: 16, height: 16 }} />
                Add lane
              </button>
            </div>

            <DndDragOverlay>
              {activeCard ? <DragOverlayCard card={activeCard} /> : null}
            </DndDragOverlay>
          </DndContext>
        </div>

        {/* Card detail panel */}
        <AnimatePresence>
          {selectedCard && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 360, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
              style={{ overflow: "hidden", flexShrink: 0 }}
            >
              <CardDetailEditor
                card={selectedCard}
                onUpdate={(updates) => handleUpdateCard(selectedCard.id, updates)}
                onClose={() => setSelectedCardId(null)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
