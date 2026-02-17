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

export const TASKCARD_SHAPE_TYPE = "taskcard" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [TASKCARD_SHAPE_TYPE]: {
      w: number;
      h: number;
      title: string;
      description: string;
      status: string;
      priority: string;
      assignee: string;
      dueDate: string;
      tags: unknown;
      subtasks: unknown;
    };
  }
}

type ITaskCardShape = TLShape<typeof TASKCARD_SHAPE_TYPE>;

// Status badge config
const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  not_started: { label: "Not Started", bg: "#D6D6D6", text: "#444444" },
  in_progress: { label: "In Progress", bg: "#A0C4FB", text: "#1a3a5c" },
  complete: { label: "Complete", bg: "#79E49B", text: "#1a4a2a" },
};

// Priority dot config
const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low: { label: "Low", color: "#A0C4FB" },
  medium: { label: "Medium", color: "#FFED7B" },
  high: { label: "High", color: "#FFADAD" },
};

export class TaskCardShapeUtil extends ShapeUtil<ITaskCardShape> {
  static override type = TASKCARD_SHAPE_TYPE;
  static override props: RecordProps<ITaskCardShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    description: T.string,
    status: T.string,
    priority: T.string,
    assignee: T.string,
    dueDate: T.string,
    tags: T.jsonValue,
    subtasks: T.jsonValue,
  };

  getDefaultProps(): ITaskCardShape["props"] {
    return {
      w: 280,
      h: 160,
      title: "Untitled task",
      description: "",
      status: "not_started",
      priority: "medium",
      assignee: "",
      dueDate: "",
      tags: [],
      subtasks: [],
    };
  }

  override canEdit() {
    return false;
  }

  override canScroll() {
    return false;
  }

  override canResize() {
    return true;
  }

  override isAspectRatioLocked() {
    return false;
  }

  getGeometry(shape: ITaskCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: ITaskCardShape, info: TLResizeInfo<ITaskCardShape>) {
    return resizeBox(shape, info);
  }

  component(shape: ITaskCardShape) {
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const { title, status, priority, assignee, dueDate } = shape.props;
    const tags = (shape.props.tags ?? []) as string[];
    const subtasks = (shape.props.subtasks ?? []) as Array<{ id: string; title: string; completed: boolean }>;

    const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
    const priorityCfg = PRIORITY_CONFIG[priority] ?? PRIORITY_CONFIG.medium;

    const completedCount = subtasks.filter((s) => s.completed).length;
    const hasSubtasks = subtasks.length > 0;

    const visibleTags = tags.slice(0, 3);
    const overflowCount = tags.length - 3;

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 8,
          border: "1px solid #e5e7eb",
          background: "#ffffff",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)",
          pointerEvents: "all",
        }}
      >
        {/* Expand button when selected */}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("shape:focus", {
                  detail: {
                    shapeType: "taskcard",
                    taskId: shape.id,
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
              border: "1px solid #e5e7eb",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <IconArrowsOutSimple css={{ width: 14, height: 14, color: "#6b7280" }} />
          </button>
        )}

        {/* Card content */}
        <div
          style={{
            padding: 12,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            height: "100%",
          }}
        >
          {/* Top row: status badge + priority dot */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "2px 8px",
                borderRadius: 4,
                background: statusCfg.bg,
                color: statusCfg.text,
                fontSize: 11,
                fontWeight: 500,
                lineHeight: "16px",
                whiteSpace: "nowrap",
              }}
            >
              {statusCfg.label}
            </span>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: priorityCfg.color,
                flexShrink: 0,
              }}
              title={`Priority: ${priorityCfg.label}`}
            />
          </div>

          {/* Title */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "#111827",
              lineHeight: "20px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          {/* Subtask progress (if any) */}
          {hasSubtasks && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  borderRadius: 2,
                  background: "#E5E7EB",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    width: `${(completedCount / subtasks.length) * 100}%`,
                    height: "100%",
                    borderRadius: 2,
                    background: "#79E49B",
                    transition: "width 200ms ease",
                  }}
                />
              </div>
              <span style={{ fontSize: 11, color: "#9CA3AF", whiteSpace: "nowrap" }}>
                {completedCount}/{subtasks.length}
              </span>
            </div>
          )}

          {/* Tags */}
          {visibleTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
              {visibleTags.map((tag, i) => (
                <span
                  key={i}
                  style={{
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "#F3F4F6",
                    color: "#4B5563",
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: "16px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {tag}
                </span>
              ))}
              {overflowCount > 0 && (
                <span
                  style={{
                    padding: "1px 6px",
                    borderRadius: 4,
                    background: "#F3F4F6",
                    color: "#9CA3AF",
                    fontSize: 11,
                    fontWeight: 500,
                    lineHeight: "16px",
                  }}
                >
                  +{overflowCount}
                </span>
              )}
            </div>
          )}

          {/* Bottom row: assignee + due date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: "auto",
            }}
          >
            {assignee ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  background: "#E5E7EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#4B5563",
                }}
                title={assignee}
              >
                {assignee.charAt(0).toUpperCase()}
              </div>
            ) : (
              <div />
            )}
            {dueDate && (
              <span style={{ fontSize: 11, color: "#9CA3AF" }}>
                {formatDueDate(dueDate)}
              </span>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ITaskCardShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    );
  }
}

function formatDueDate(isoDate: string): string {
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    if (diffDays === -1) return "Yesterday";
    if (diffDays > 0 && diffDays <= 7) return `In ${diffDays}d`;
    if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)}d ago`;

    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return isoDate;
  }
}
