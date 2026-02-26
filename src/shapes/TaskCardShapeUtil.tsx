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

// Status config — colored dot + semi-transparent background
const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  not_started: { label: "Not Started", color: "var(--color-gray-500)" },
  in_progress: { label: "In Progress", color: "#F59E0B" },
  complete: { label: "Complete", color: "#10B981" },
};

// Tag color palette — deterministic assignment by hash
const TAG_COLORS = [
  "#EF4444", "#3B82F6", "#8B5CF6", "#F59E0B",
  "#10B981", "#6366F1", "#EC4899", "#14B8A6",
];

function getTagColor(tag: string): string {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = ((hash << 5) - hash + tag.charCodeAt(i)) | 0;
  }
  return TAG_COLORS[Math.abs(hash) % TAG_COLORS.length];
}

// Avatar colors — deterministic assignment by name hash
const AVATAR_COLORS = ["#4262FF", "#C8B6FF", "#B8F077", "#F48FB1", "#FFD02F", "#80DEEA"];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

const MAX_VISIBLE_TAGS = 3;

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
      w: 288,
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
    const { title, status, assignee } = shape.props;
    const tags = (shape.props.tags ?? []) as string[];

    const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.not_started;
    const visibleTags = tags.slice(0, MAX_VISIBLE_TAGS);
    const overflowCount = tags.length - MAX_VISIBLE_TAGS;

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 16,
          border: "1px solid var(--color-gray-200)",
          background: "#ffffff",
          boxShadow: isSelected
            ? "0 4px 12px rgba(0,0,0,0.08)"
            : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
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
              border: "1px solid var(--color-gray-200)",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <IconArrowsOutSimple css={{ width: 14, height: 14, color: "var(--color-gray-500)" }} />
          </button>
        )}

        {/* Card content */}
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            height: "100%",
            boxSizing: "border-box",
          }}
        >
          {/* Title */}
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              color: "var(--color-gray-900)",
              lineHeight: "20px",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>

          {/* Bottom row: status badge + tag chips + assignee avatar */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginTop: 12,
            }}
          >
            {/* Left: badges */}
            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: 6,
                minWidth: 0,
                flex: 1,
              }}
            >
              {/* Status badge with dot */}
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "2px 8px",
                  borderRadius: 9999,
                  backgroundColor: `${statusCfg.color}20`,
                  color: statusCfg.color,
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: "14px",
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    backgroundColor: statusCfg.color,
                    flexShrink: 0,
                  }}
                />
                {statusCfg.label}
              </span>

              {/* Tag chips */}
              {visibleTags.map((tag, i) => {
                const color = getTagColor(tag);
                return (
                  <span
                    key={i}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      padding: "2px 6px",
                      borderRadius: 9999,
                      backgroundColor: `${color}20`,
                      color: color,
                      fontSize: 9,
                      fontWeight: 600,
                      lineHeight: "12px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {tag}
                  </span>
                );
              })}
              {overflowCount > 0 && (
                <span style={{ fontSize: 9, fontWeight: 500, color: "var(--color-gray-400)" }}>
                  +{overflowCount}
                </span>
              )}
            </div>

            {/* Assignee avatar */}
            {assignee ? (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  backgroundColor: getAvatarColor(assignee),
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 9,
                  fontWeight: 700,
                  color: "white",
                  flexShrink: 0,
                  marginLeft: 8,
                }}
                title={assignee}
              >
                {getInitials(assignee)}
              </div>
            ) : (
              <div
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: "50%",
                  border: "1px dashed var(--color-gray-300)",
                  flexShrink: 0,
                  marginLeft: 8,
                }}
              />
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
        rx={16}
        ry={16}
      />
    );
  }
}
