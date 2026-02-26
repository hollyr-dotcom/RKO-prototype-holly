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
  createShapePropsMigrationSequence,
  createShapePropsMigrationIds,
} from "tldraw";
import { IconArrowsOutSimple } from "@mirohq/design-system-icons";
import { GanttInteractive } from "./GanttInteractive";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

// ── Data Types ──

export interface GanttTask {
  id: number;
  text: string;
  start: string; // ISO date string
  end: string; // ISO date string
  duration: number; // days
  progress: number; // 0-100
  parent: number; // 0 = root
  type: string; // "task" | "summary" | "milestone"
  open: boolean;
  color?: string; // optional override (e.g. "red" for conflict tasks)
}

export interface GanttLink {
  id: number;
  source: number;
  target: number;
  type: string; // "e2s" | "s2s" | "e2e" | "s2e"
}

export interface GanttScale {
  unit: string;
  step: number;
  format: string;
}

export interface GanttColumn {
  id: string;
  header: string;
  width: number;
  align?: "left" | "center" | "right";
}

// ── Shape Type ──

export const GANTTCHART_SHAPE_TYPE = "ganttchart" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [GANTTCHART_SHAPE_TYPE]: {
      w: number;
      h: number;
      title: string;
      tasks: unknown;
      links: unknown;
      scales: unknown;
      columns: unknown;
      colorScheme: string;
    };
  }
}

type IGanttChartShape = TLShape<typeof GANTTCHART_SHAPE_TYPE>;

// ── Default Data ──

function getDefaultTasks(): GanttTask[] {
  const today = new Date();
  const d = (offset: number) => {
    const date = new Date(today);
    date.setDate(date.getDate() + offset);
    return date.toISOString();
  };

  return [
    {
      id: 1,
      text: "Phase 1: Planning",
      start: d(0),
      end: d(6),
      duration: 6,
      progress: 0,
      parent: 0,
      type: "summary",
      open: true,
    },
    {
      id: 2,
      text: "Requirements",
      start: d(0),
      end: d(3),
      duration: 3,
      progress: 0,
      parent: 1,
      type: "task",
      open: false,
    },
    {
      id: 3,
      text: "Design",
      start: d(3),
      end: d(6),
      duration: 3,
      progress: 0,
      parent: 1,
      type: "task",
      open: false,
    },
    {
      id: 4,
      text: "Phase 2: Implementation",
      start: d(7),
      end: d(27),
      duration: 20,
      progress: 0,
      parent: 0,
      type: "summary",
      open: true,
    },
    {
      id: 5,
      text: "Development",
      start: d(7),
      end: d(17),
      duration: 10,
      progress: 0,
      parent: 4,
      type: "task",
      open: false,
    },
  ];
}

function getDefaultLinks(): GanttLink[] {
  return [
    { id: 1, source: 2, target: 3, type: "e2s" },
    { id: 2, source: 3, target: 5, type: "e2s" },
  ];
}

function getDefaultScales(): GanttScale[] {
  return [
    { unit: "month", step: 1, format: "%F %Y" },
    { unit: "week", step: 1, format: "%j" },
  ];
}

function getDefaultColumns(): GanttColumn[] {
  return [
    { id: "text", header: "Task name", width: 210 },
    { id: "start", header: "Start date", width: 106 },
    { id: "add-task", header: "", width: 40 },
  ];
}

// ── Migration: add colorScheme prop to existing gantt shapes ──

const ganttVersions = createShapePropsMigrationIds(GANTTCHART_SHAPE_TYPE, {
  AddColorScheme: 1,
});

const ganttMigrations = createShapePropsMigrationSequence({
  sequence: [
    {
      id: ganttVersions.AddColorScheme,
      up(props: Record<string, unknown>) {
        props.colorScheme = "";
      },
      down(props: Record<string, unknown>) {
        delete props.colorScheme;
      },
    },
  ],
});

// ── Shape Util ──

export class GanttChartShapeUtil extends ShapeUtil<IGanttChartShape> {
  static override type = GANTTCHART_SHAPE_TYPE;
  static override migrations = ganttMigrations;
  static override props: RecordProps<IGanttChartShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    tasks: T.jsonValue,
    links: T.jsonValue,
    scales: T.jsonValue,
    columns: T.jsonValue,
    colorScheme: T.string,
  };

  getDefaultProps(): IGanttChartShape["props"] {
    return {
      w: 1060,
      h: 400,
      title: "Project Timeline",
      tasks: getDefaultTasks() as unknown as IGanttChartShape["props"]["tasks"],
      links: getDefaultLinks() as unknown as IGanttChartShape["props"]["links"],
      scales:
        getDefaultScales() as unknown as IGanttChartShape["props"]["scales"],
      columns:
        getDefaultColumns() as unknown as IGanttChartShape["props"]["columns"],
      colorScheme: "",
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

  getGeometry(shape: IGanttChartShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(
    shape: IGanttChartShape,
    info: TLResizeInfo<IGanttChartShape>
  ) {
    return resizeBox(shape, info);
  }

  component(shape: IGanttChartShape) {
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
                    shapeType: "ganttchart",
                    ganttId: shape.id,
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
          shapeType={GANTTCHART_SHAPE_TYPE}
          shapeH={shape.props.h}
          shapeW={shape.props.w}
          editor={this.editor}
          syncWidth
          growOnly
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

          {/* Interactive Gantt */}
          <div style={{ flex: 1 }}>
            <GanttInteractive
              shapeId={shape.id}
              editor={this.editor}
              isEditing={isEditing}
              colorScheme={(shape.props as any).colorScheme || ""}
              onEscape={() => this.editor.setEditingShape(null)}
            />
          </div>
        </AutoSizeWrapper>
      </HTMLContainer>
    );
  }

  indicator(shape: IGanttChartShape) {
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
