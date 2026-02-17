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
import { Gantt, Willow } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import "./gantt-theme.css";
import { IconArrowsOutSimple } from "@mirohq/design-system-icons";
import { useMemo } from "react";

// ── Data Types ──

export interface GanttTask {
  id: number;
  text: string;
  start: string; // ISO date string
  end: string; // ISO date string
  progress: number; // 0-100
  parent: number; // 0 = root
  type: string; // "task" | "summary" | "milestone"
  open: boolean;
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
      progress: 0,
      parent: 1,
      type: "task",
      open: true,
    },
    {
      id: 3,
      text: "Design",
      start: d(3),
      end: d(6),
      progress: 0,
      parent: 1,
      type: "task",
      open: true,
    },
    {
      id: 4,
      text: "Phase 2: Implementation",
      start: d(7),
      end: d(27),
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
      progress: 0,
      parent: 4,
      type: "task",
      open: true,
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
    { unit: "month", step: 1, format: "MMMM yyyy" },
    { unit: "week", step: 1, format: "d" },
  ];
}

function getDefaultColumns(): GanttColumn[] {
  return [
    { id: "text", header: "Task name", width: 210 },
    { id: "start", header: "Start date", width: 106 },
    { id: "add-task", header: "", width: 40 },
  ];
}

// ── Compact Preview Component ──

function GanttPreview({ shape }: { shape: IGanttChartShape }) {
  const tasks = useMemo(() => {
    const raw = (shape.props.tasks ?? []) as GanttTask[];
    return raw.map((t) => ({
      ...t,
      start: new Date(t.start),
      end: new Date(t.end),
    }));
  }, [shape.props.tasks]);

  const links = (shape.props.links ?? []) as GanttLink[];
  const scales = (shape.props.scales ?? []) as GanttScale[];
  const columns = (shape.props.columns ?? []) as GanttColumn[];

  return (
    <div
      className="gantt-canvas-shape"
      style={{
        width: "100%",
        height: "100%",
        overflow: "hidden",
      }}
    >
      <Willow>
        <Gantt
          tasks={tasks}
          links={links}
          scales={scales}
          columns={columns}
          readonly={true}
        />
      </Willow>
    </div>
  );
}

// ── Shape Util ──

export class GanttChartShapeUtil extends ShapeUtil<IGanttChartShape> {
  static override type = GANTTCHART_SHAPE_TYPE;
  static override props: RecordProps<IGanttChartShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    tasks: T.jsonValue,
    links: T.jsonValue,
    scales: T.jsonValue,
    columns: T.jsonValue,
  };

  getDefaultProps(): IGanttChartShape["props"] {
    return {
      w: 700,
      h: 400,
      title: "Project Timeline",
      tasks: getDefaultTasks() as unknown as IGanttChartShape["props"]["tasks"],
      links: getDefaultLinks() as unknown as IGanttChartShape["props"]["links"],
      scales:
        getDefaultScales() as unknown as IGanttChartShape["props"]["scales"],
      columns:
        getDefaultColumns() as unknown as IGanttChartShape["props"]["columns"],
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
        }}
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
              color: "#111827",
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {shape.props.title}
          </span>

          {/* Expand button — only when selected */}
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
                flexShrink: 0,
              }}
            >
              <IconArrowsOutSimple
                css={{ width: 14, height: 14, color: "#6b7280" }}
              />
            </button>
          )}
        </div>

        {/* Gantt preview — pointer events disabled so canvas handles drag */}
        <div
          style={{
            flex: 1,
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <GanttPreview shape={shape} />
        </div>
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
