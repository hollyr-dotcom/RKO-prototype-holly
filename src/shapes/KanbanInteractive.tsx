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
import { IconPlus } from "@mirohq/design-system-icons";
import type { Editor as TLEditor, TLShapeId } from "tldraw";
import type { KanbanLane, KanbanCard } from "./KanbanBoardShapeUtil";
import {
  KANBANBOARD_SHAPE_TYPE,
  STATUS_OPTIONS,
  STATUS_MAPPING_TO_VALUE,
  getTagColor,
  getAvatarInfo,
} from "./KanbanBoardShapeUtil";

// ── Card Component (used in both static and interactive modes) ──

function KanbanCardView({
  card,
  isSelected,
  onClick,
  style,
  dragProps,
}: {
  card: KanbanCard;
  isSelected?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
  dragProps?: Record<string, unknown>;
}) {
  const statusOpt = STATUS_OPTIONS.find((o) => o.value === card.status);
  const avatarInfo = card.assignee ? getAvatarInfo(card.assignee) : null;
  const visibleTags = card.tags.slice(0, 3);
  const overflowCount = card.tags.length - 3;

  return (
    <div
      style={{
        background: "#ffffff",
        border: isSelected ? "2px solid #3B82F6" : "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 12,
        cursor: dragProps ? "grab" : "default",
        boxShadow: isSelected
          ? "0 4px 12px rgba(59,130,246,0.15)"
          : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
        ...style,
      }}
      {...dragProps}
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 4,
          }}
        >
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
            <span style={{ fontSize: 9, fontWeight: 500, color: "#9CA3AF" }}>
              +{overflowCount}
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

// ── Sortable Card (editing mode only) ──

function SortableCard({
  card,
  isSelected,
  onClick,
}: {
  card: KanbanCard;
  isSelected: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }}
    >
      <KanbanCardView
        card={card}
        isSelected={isSelected}
        onClick={onClick}
        dragProps={{ ...attributes, ...listeners }}
      />
    </div>
  );
}

// ── Droppable Lane (editing mode) ──

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
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(lane.title);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleDraft(lane.title);
  }, [lane.title]);

  useEffect(() => {
    if (isEditingTitle) inputRef.current?.focus();
  }, [isEditingTitle]);

  useEffect(() => {
    if (!showMenu) return;
    const handle = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node))
        setShowMenu(false);
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [showMenu]);

  const commitTitle = useCallback(() => {
    setIsEditingTitle(false);
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
        {isEditingTitle ? (
          <input
            ref={inputRef}
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={(e) => {
              if (e.key === "Enter") commitTitle();
              if (e.key === "Escape") {
                setTitleDraft(lane.title);
                setIsEditingTitle(false);
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
            onClick={() => setIsEditingTitle(true)}
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
          border: isOver
            ? "1px solid rgba(59,130,246,0.3)"
            : "1px solid #e5e7eb",
          background: isOver ? "rgba(59,130,246,0.04)" : "#f9fafb",
          padding: 10,
          transition: "background 0.15s, border-color 0.15s",
          minHeight: 100,
        }}
      >
        <SortableContext
          items={laneCardIds}
          strategy={verticalListSortingStrategy}
        >
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
        >
          <IconPlus css={{ width: 14, height: 14 }} />
          Add card
        </button>
      </div>
    </div>
  );
}

// ── Drag Overlay Card ──

function DragOverlayCard({ card }: { card: KanbanCard }) {
  return (
    <div style={{ width: 268 }}>
      <KanbanCardView
        card={card}
        style={{
          cursor: "grabbing",
          boxShadow:
            "0 12px 28px rgba(0,0,0,0.15), 0 4px 10px rgba(0,0,0,0.08)",
          transform: "rotate(2deg) scale(1.03)",
        }}
      />
    </div>
  );
}

// ── Static Lane (non-editing mode) ──

function StaticLane({
  lane,
  laneCards,
}: {
  lane: KanbanLane;
  laneCards: KanbanCard[];
}) {
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
        <span
          style={{
            flex: 1,
            fontSize: 13,
            fontWeight: 600,
            color: "#111827",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {lane.title}
        </span>
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
      </div>

      {/* Card container */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          borderRadius: 12,
          border: "1px solid #e5e7eb",
          background: "#f9fafb",
          padding: 10,
          minHeight: 100,
        }}
      >
        {laneCards.map((card) => (
          <KanbanCardView key={card.id} card={card} />
        ))}

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
      </div>
    </div>
  );
}

// ── Main Interactive Component ──

export function KanbanInteractive({
  shapeId,
  editor,
  isEditing,
  onEscape,
}: {
  shapeId: string;
  editor: TLEditor;
  isEditing: boolean;
  onEscape?: () => void;
}) {
  const [localLanes, setLocalLanes] = useState<KanbanLane[]>([]);
  const [localCards, setLocalCards] = useState<KanbanCard[]>([]);
  const [localCardsByLane, setLocalCardsByLane] = useState<
    Record<string, string[]>
  >({});
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Read shape data
  const shape = editor.getShape(shapeId as TLShapeId);
  const props = shape?.props as
    | {
        title: string;
        lanes: KanbanLane[];
        cards: KanbanCard[];
        cardsByLane: Record<string, string[]>;
      }
    | undefined;

  // Initialize from shape
  useEffect(() => {
    if (!props) return;
    setLocalLanes(props.lanes ?? []);
    setLocalCards(props.cards ?? []);
    setLocalCardsByLane(props.cardsByLane ?? {});
  }, [shapeId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Derived
  const cardsById = useMemo(() => {
    const map = new Map<string, KanbanCard>();
    localCards.forEach((c) => map.set(c.id, c));
    return map;
  }, [localCards]);

  const laneIds = useMemo(
    () => new Set(localLanes.map((l) => l.id)),
    [localLanes]
  );

  const activeCard = activeId ? (cardsById.get(activeId) ?? null) : null;

  // Sync changes back to shape (debounced)
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const syncToShape = useCallback(
    (updates: Partial<{
      lanes: KanbanLane[];
      cards: KanbanCard[];
      cardsByLane: Record<string, string[]>;
    }>) => {
      const currentShape = editor.getShape(shapeId as TLShapeId);
      if (!currentShape) return;
      editor.updateShape({
        id: currentShape.id,
        type: KANBANBOARD_SHAPE_TYPE,
        props: {
          ...(currentShape.props as Record<string, unknown>),
          ...updates,
        },
      } as any);
    },
    [editor, shapeId]
  );

  useEffect(() => {
    if (!isEditing) return; // Only sync when editing
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
  }, [localLanes, localCards, localCardsByLane, syncToShape, isEditing]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

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
    [localCardsByLane]
  );

  const resolveOverLane = useCallback(
    (overId: string): string | null => {
      if (laneIds.has(overId)) return overId;
      return findLaneForCard(overId);
    },
    [laneIds, findLaneForCard]
  );

  const updateCardStatusForLane = useCallback(
    (
      cardId: string,
      toLaneId: string,
      currentCards: KanbanCard[]
    ): KanbanCard[] => {
      const targetLane = localLanes.find((l) => l.id === toLaneId);
      if (!targetLane || !targetLane.statusMapping) return currentCards;
      const newStatus = STATUS_MAPPING_TO_VALUE[targetLane.statusMapping];
      if (!newStatus) return currentCards;
      return currentCards.map((c) =>
        c.id === cardId ? { ...c, status: newStatus } : c
      );
    },
    [localLanes]
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
      setLocalCards((prev) => updateCardStatusForLane(taskId, toLaneId, prev));
    },
    [updateCardStatusForLane]
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
    []
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
    [localCardsByLane, findLaneForCard, resolveOverLane, handleMoveCard]
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
    },
    [
      localCardsByLane,
      findLaneForCard,
      resolveOverLane,
      laneIds,
      handleMoveCard,
      handleReorderInLane,
    ]
  );

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
    [localLanes]
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
    setLocalLanes((prev) =>
      prev.map((l) => (l.id === laneId ? { ...l, title } : l))
    );
  }, []);

  const handleDeleteLane = useCallback((laneId: string) => {
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
  }, []);

  const handleCardClick = useCallback((cardId: string) => {
    setSelectedCardId((prev) => (prev === cardId ? null : cardId));
  }, []);

  if (!props) return null;

  // Use shape data directly for static mode, local state for editing
  const displayLanes = isEditing ? localLanes : (props.lanes ?? []);
  const displayCards = isEditing ? localCards : (props.cards ?? []);
  const displayCardsByLane = isEditing
    ? localCardsByLane
    : (props.cardsByLane ?? {});
  const displayCardsById = isEditing
    ? cardsById
    : new Map(displayCards.map((c) => [c.id, c]));

  return (
    <div
      style={{ width: "100%", height: "100%", overflow: "hidden" }}
      onPointerDown={(e) => {
        if (isEditing) e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onEscape?.();
        } else if (isEditing) {
          e.stopPropagation();
        }
      }}
    >
      <style>{`
        .kanban-hover-bg:hover { background-color: rgba(0,0,0,0.03); }
      `}</style>

      {isEditing ? (
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
              padding: 16,
              height: "100%",
              alignItems: "flex-start",
              overflowX: "auto",
              overflowY: "hidden",
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
            >
              <IconPlus css={{ width: 16, height: 16 }} />
              Add lane
            </button>
          </div>

          <DndDragOverlay>
            {activeCard ? <DragOverlayCard card={activeCard} /> : null}
          </DndDragOverlay>
        </DndContext>
      ) : (
        /* Static mode — no DnD, no click handlers */
        <div
          style={{
            display: "flex",
            gap: 16,
            padding: 16,
            height: "100%",
            alignItems: "flex-start",
            overflowX: "auto",
            overflowY: "hidden",
          }}
        >
          {displayLanes.map((lane) => {
            const laneCardIds = displayCardsByLane[lane.id] ?? [];
            const laneCards = laneCardIds
              .map((id) => displayCardsById.get(id))
              .filter((c): c is KanbanCard => c !== undefined);

            return <StaticLane key={lane.id} lane={lane} laneCards={laneCards} />;
          })}
        </div>
      )}
    </div>
  );
}
