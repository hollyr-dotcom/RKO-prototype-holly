"use client";

import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLResizeInfo,
  TLShape,
  resizeBox,
} from "tldraw";
import { IconArrowsOutSimple } from "@mirohq/design-system-icons";
import { TASKCARD_SHAPE_TYPE } from "./TaskCardShapeUtil";
import { KanbanInteractive } from "./KanbanInteractive";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

// ── Data Types ──

export interface KanbanLane {
  id: string;
  title: string;
  color: string;
  statusMapping: string;
}

export interface KanbanCard {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignee: string;
  dueDate: string;
  tags: string[];
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
}

// ── Shape Type ──

export const KANBANBOARD_SHAPE_TYPE = "kanbanboard" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [KANBANBOARD_SHAPE_TYPE]: {
      w: number;
      h: number;
      title: string;
      lanes: unknown;
      cards: unknown;
      cardsByLane: unknown;
    };
  }
}

type IKanbanBoardShape = TLShape<typeof KANBANBOARD_SHAPE_TYPE>;

// ── Shared Config ──

export interface SelectOpt {
  value: string;
  label: string;
  color: string;
}

export const STATUS_OPTIONS: SelectOpt[] = [
  { value: "not_started", label: "Not Started", color: "var(--color-gray-500)" },
  { value: "in_progress", label: "In Progress", color: "#F59E0B" },
  { value: "complete", label: "Complete", color: "#10B981" },
];

export const PRIORITY_OPTIONS: SelectOpt[] = [
  { value: "low", label: "Low", color: "var(--color-gray-500)" },
  { value: "medium", label: "Medium", color: "#F59E0B" },
  { value: "high", label: "High", color: "#EF4444" },
];

export const LABEL_OPTIONS = [
  { value: "Bug", color: "#EF4444" },
  { value: "Feature", color: "#3B82F6" },
  { value: "Design", color: "#8B5CF6" },
  { value: "Frontend", color: "#F59E0B" },
  { value: "Backend", color: "#10B981" },
  { value: "Infra", color: "#6366F1" },
  { value: "Docs", color: "#EC4899" },
  { value: "Performance", color: "#14B8A6" },
];

export interface TeamMember {
  id: string;
  name: string;
  initials: string;
  avatarColor: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  { id: "u-1", name: "Mark B", initials: "MB", avatarColor: "#4262FF" },
  { id: "u-2", name: "Alice S", initials: "AS", avatarColor: "#C8B6FF" },
  { id: "u-3", name: "Jun L", initials: "JL", avatarColor: "#B8F077" },
  { id: "u-4", name: "Ravi N", initials: "RN", avatarColor: "#F48FB1" },
  { id: "u-5", name: "Kate R", initials: "KR", avatarColor: "#FFD02F" },
  { id: "u-6", name: "Tom P", initials: "TP", avatarColor: "#80DEEA" },
];

export const TAG_COLORS = ["#EF4444", "#3B82F6", "#8B5CF6", "#F59E0B", "#10B981", "#6366F1", "#EC4899", "#14B8A6"];

export function getTagColor(tag: string): string {
  const known = LABEL_OPTIONS.find((o) => o.value === tag);
  if (known) return known.color;
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

export function getAvatarInfo(name: string): { initials: string; color: string } {
  const member = TEAM_MEMBERS.find((m) => m.name === name);
  if (member) return { initials: member.initials, color: member.avatarColor };
  const parts = name.trim().split(/\s+/);
  const initials =
    parts.length >= 2
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : name.slice(0, 2).toUpperCase();
  const colors = ["#4262FF", "#C8B6FF", "#B8F077", "#F48FB1", "#FFD02F", "#80DEEA"];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  return { initials, color: colors[Math.abs(hash) % colors.length] };
}

export const STATUS_MAPPING_TO_VALUE: Record<string, string> = {
  "To Do": "not_started",
  "In Progress": "in_progress",
  "Done": "complete",
};

// ── Helper ──

function mapStatusToDisplay(status: string): string {
  const MAP: Record<string, string> = {
    not_started: "To Do",
    in_progress: "In Progress",
    complete: "Done",
  };
  return MAP[status] || "To Do";
}

// ── Default Data ──

function getDefaultLanes(): KanbanLane[] {
  return [
    { id: "lane-todo", title: "To Do", color: "#3B82F6", statusMapping: "To Do" },
    { id: "lane-doing", title: "Doing", color: "#F59E0B", statusMapping: "In Progress" },
    { id: "lane-done", title: "Done", color: "#10B981", statusMapping: "Done" },
  ];
}

function getDefaultCards(): KanbanCard[] {
  return [
    {
      id: "kb-card-1",
      title: "Design navigation patterns",
      description: "",
      status: "not_started",
      priority: "high",
      assignee: "Mark B",
      dueDate: "",
      tags: ["Design", "Feature"],
      subtasks: [],
    },
    {
      id: "kb-card-2",
      title: "Set up CI pipeline",
      description: "",
      status: "not_started",
      priority: "medium",
      assignee: "",
      dueDate: "",
      tags: ["Infra"],
      subtasks: [],
    },
  ];
}

function getDefaultCardsByLane(): Record<string, string[]> {
  return {
    "lane-todo": ["kb-card-1", "kb-card-2"],
    "lane-doing": [],
    "lane-done": [],
  };
}

// ── Shape Util ──

export class KanbanBoardShapeUtil extends ShapeUtil<IKanbanBoardShape> {
  static override type = KANBANBOARD_SHAPE_TYPE;
  static override props: RecordProps<IKanbanBoardShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    lanes: T.jsonValue,
    cards: T.jsonValue,
    cardsByLane: T.jsonValue,
  };

  getDefaultProps(): IKanbanBoardShape["props"] {
    return {
      w: 800,
      h: 500,
      title: "Kanban Board",
      lanes: getDefaultLanes() as unknown as IKanbanBoardShape["props"]["lanes"],
      cards: getDefaultCards() as unknown as IKanbanBoardShape["props"]["cards"],
      cardsByLane: getDefaultCardsByLane() as unknown as IKanbanBoardShape["props"]["cardsByLane"],
    };
  }

  override canEdit() {
    return true;
  }

  override canScroll() {
    return true;
  }

  override canResize() {
    return true;
  }

  override isAspectRatioLocked() {
    return false;
  }

  getGeometry(shape: IKanbanBoardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(
    shape: IKanbanBoardShape,
    info: TLResizeInfo<IKanbanBoardShape>
  ) {
    return resizeBox(shape, info);
  }

  override onDropShapesOver(shape: IKanbanBoardShape, shapes: TLShape[]) {
    if (!shape) return;

    const taskCards = shapes.filter((s) => s.type === TASKCARD_SHAPE_TYPE);
    if (taskCards.length === 0) return;

    const lanes = (shape.props.lanes ?? []) as KanbanLane[];
    const cards = [...((shape.props.cards ?? []) as KanbanCard[])];
    const cardsByLane = {
      ...((shape.props.cardsByLane ?? {}) as Record<string, string[]>),
    };
    // Deep copy lane arrays
    for (const key of Object.keys(cardsByLane)) {
      cardsByLane[key] = [...cardsByLane[key]];
    }

    for (const tc of taskCards) {
      const props = tc.props as Record<string, unknown>;
      const cardId = `kb-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

      // Map status to lane
      const status = (props.status as string) || "not_started";
      let targetLane = lanes[0]?.id;
      for (const lane of lanes) {
        if (lane.statusMapping === mapStatusToDisplay(status)) {
          targetLane = lane.id;
          break;
        }
      }

      const newCard: KanbanCard = {
        id: cardId,
        title: (props.title as string) || "Untitled",
        description: (props.description as string) || "",
        status: (props.status as string) || "not_started",
        priority: (props.priority as string) || "medium",
        assignee: (props.assignee as string) || "",
        dueDate: (props.dueDate as string) || "",
        tags: Array.isArray(props.tags) ? (props.tags as string[]) : [],
        subtasks: Array.isArray(props.subtasks)
          ? (props.subtasks as KanbanCard["subtasks"])
          : [],
      };

      cards.push(newCard);
      if (!cardsByLane[targetLane]) cardsByLane[targetLane] = [];
      cardsByLane[targetLane].push(cardId);
    }

    this.editor.updateShape<IKanbanBoardShape>({
      id: shape.id,
      type: KANBANBOARD_SHAPE_TYPE,
      props: { cards, cardsByLane },
    });

    // Delete the absorbed task cards
    this.editor.deleteShapes(taskCards.map((s) => s.id));
  }

  component(shape: IKanbanBoardShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 12,
          border: "1px solid rgba(0,0,0,0.08)",
          background: "#ffffff",
          boxShadow: isSelected
            ? "0 4px 12px rgba(0,0,0,0.08)"
            : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
          pointerEvents: "all",
          display: "flex",
          flexDirection: "column",
          position: "relative",
        }}
      >
        {/* Overlay blocks pointer events when NOT editing */}
        {!isEditing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
            }}
          />
        )}

        {/* Expand button — absolutely positioned, always above overlay */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("shape:focus", {
                  detail: {
                    shapeType: "kanbanboard",
                    kanbanId: shape.id,
                    title: shape.props.title,
                  },
                })
              );
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 20,
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid var(--color-gray-200)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              flexShrink: 0,
            }}
          >
            <IconArrowsOutSimple
              css={{ width: 14, height: 14, color: "var(--color-gray-500)" }}
            />
          </button>
        )}

        <AutoSizeWrapper
          shapeId={shape.id}
          shapeType={KANBANBOARD_SHAPE_TYPE}
          shapeH={shape.props.h}
          shapeW={shape.props.w}
          editor={this.editor}
          syncWidth
        >
          {/* Title bar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 12px",
              borderBottom: "1px solid rgba(0,0,0,0.06)",
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: "var(--color-gray-900)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {shape.props.title}
            </span>
          </div>

          {/* Interactive Kanban */}
          <div style={{ flex: 1 }}>
            <KanbanInteractive
              shapeId={shape.id}
              editor={this.editor}
              isEditing={isEditing}
              onEscape={() => this.editor.setEditingShape(null)}
            />
          </div>
        </AutoSizeWrapper>
      </HTMLContainer>
    );
  }

  indicator(shape: IKanbanBoardShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={12}
        ry={12}
      />
    );
  }
}
