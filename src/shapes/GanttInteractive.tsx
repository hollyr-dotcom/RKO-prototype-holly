"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";

// Error boundary — the Gantt library has an internal bug that crashes on some data
class GanttErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-gray-400)", fontSize: 13, padding: 20, textAlign: "center" }}>
          Timeline preview unavailable — click to expand and edit
        </div>
      );
    }
    return this.props.children;
  }
}
import {
  Gantt,
  Willow,
  ContextMenu,
  Tooltip,
  Editor,
} from "@svar-ui/react-gantt";
import type { IApi } from "@svar-ui/react-gantt";
import "@svar-ui/react-gantt/all.css";
import "./gantt-theme.css";
import type { Editor as TLEditor, TLShapeId } from "tldraw";
import type {
  GanttTask,
  GanttLink,
  GanttScale,
  GanttColumn,
} from "./GanttChartShapeUtil";

// ── Helpers ──

function deserializeTasks(raw: GanttTask[]) {
  // Build set of IDs that are parents (have children referencing them)
  const parentIds = new Set<number>();
  for (const t of raw) {
    if (t.parent && t.parent !== 0) parentIds.add(t.parent);
  }

  return raw.map((t) => ({
    ...t,
    start: new Date(t.start),
    end: new Date(t.end),
    // CRITICAL: only summary/parent tasks can have open=true.
    // Leaf tasks with open=true crash the library (null.forEach).
    open: parentIds.has(t.id) ? (t.open ?? true) : false,
    // Map color:"red" to custom type "conflict" for native bar styling.
    // Only remap "task" type — summary/milestone need their original type for behavior.
    type: (t.color === "red" && t.type === "task") ? "conflict" : t.type,
  }));
}

// Custom task types for the Gantt library — includes "conflict" for red bars
const GANTT_TASK_TYPES = [
  { id: "task", label: "Task" },
  { id: "summary", label: "Summary task" },
  { id: "conflict", label: "Conflict" },
];

function serializeTasks(
  tasks: Array<{
    id: number;
    text?: string;
    start: Date | string;
    end: Date | string;
    progress?: number;
    parent?: number;
    type?: string;
    open?: boolean;
    [key: string]: unknown;
  }>
): GanttTask[] {
  return tasks.map((t) => ({
    id: t.id as number,
    text: (t.text as string) ?? "",
    start: t.start instanceof Date ? t.start.toISOString() : String(t.start),
    end: t.end instanceof Date ? t.end.toISOString() : String(t.end),
    duration: (t.duration as number) ?? 1,
    progress: (t.progress as number) ?? 0,
    parent: (t.parent as number) ?? 0,
    type: (t.type as string) ?? "task",
    open: t.type === "summary" ? ((t.open as boolean) ?? true) : false,
  }));
}

// ── Shared Interactive Gantt Component ──

export function GanttInteractive({
  shapeId,
  editor,
  isEditing,
  colorScheme,
  onEscape,
}: {
  shapeId: string;
  editor: TLEditor;
  isEditing: boolean;
  colorScheme?: string;
  onEscape?: () => void;
}) {
  const [api, setApi] = useState<IApi | null>(null);

  // Read shape props
  const shape = editor.getShape(shapeId as TLShapeId);
  const props = shape?.props as
    | {
        title: string;
        tasks: GanttTask[];
        links: GanttLink[];
        scales: GanttScale[];
        columns: GanttColumn[];
      }
    | undefined;

  // Deserialize tasks (ISO strings → Date objects)
  const tasks = useMemo(
    () => deserializeTasks((props?.tasks ?? []) as GanttTask[]),
    [props?.tasks]
  );

  const links = (props?.links ?? []) as GanttLink[];
  const columns = (props?.columns ?? []) as GanttColumn[];

  // Auto-compute viewport start/end from tasks so bars are always visible
  const { chartStart, chartEnd, smartScales } = useMemo(() => {
    if (!tasks.length) return { chartStart: undefined, chartEnd: undefined, smartScales: (props?.scales ?? []) as GanttScale[] };

    let minDate = tasks[0].start;
    let maxDate = tasks[0].end;
    for (const t of tasks) {
      if (t.start < minDate) minDate = t.start;
      if (t.end > maxDate) maxDate = t.end;
    }

    // Add padding: 1 week before, 2 weeks after
    const pad = (d: Date, days: number) => {
      const r = new Date(d);
      r.setDate(r.getDate() + days);
      return r;
    };
    const start = pad(minDate, -7);
    const end = pad(maxDate, 14);

    // Pick scales based on date span
    const spanDays = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    let scales: GanttScale[];
    if (spanDays <= 30) {
      scales = [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "day", step: 1, format: "%j" },
      ];
    } else if (spanDays <= 120) {
      scales = [
        { unit: "month", step: 1, format: "%F %Y" },
        { unit: "week", step: 1, format: "%j" },
      ];
    } else {
      scales = [
        { unit: "quarter", step: 1, format: "%F %Y" },
        { unit: "month", step: 1, format: "%F" },
      ];
    }

    return { chartStart: start, chartEnd: end, smartScales: scales };
  }, [tasks, props?.scales]);

  // Save changes back to shape
  const saveToShape = useCallback(
    (updates: Record<string, unknown>) => {
      if (!editor || !shapeId) return;
      const currentShape = editor.getShape(shapeId as TLShapeId);
      if (!currentShape) return;

      editor.updateShape({
        id: currentShape.id,
        type: "ganttchart",
        props: {
          ...(currentShape.props as Record<string, unknown>),
          ...updates,
        },
      } as any);
    },
    [editor, shapeId]
  );

  // Listen for Gantt changes via the api
  useEffect(() => {
    if (!api) return;

    const tag = `gantt-interactive-${shapeId}`;

    const handleChange = () => {
      const state = api.getState();
      const rawTasks =
        (state.tasks as any)?.toArray?.() ??
        (Array.isArray(state.tasks) ? state.tasks : []);
      const serializedTasks = serializeTasks(rawTasks as any);
      const rawLinks =
        (state.links as any)?.toArray?.() ??
        (Array.isArray(state.links) ? state.links : []);
      const serializedLinks = rawLinks.map((l: any) => ({
        id: l.id,
        source: l.source,
        target: l.target,
        type: l.type,
      }));

      saveToShape({
        tasks: serializedTasks,
        links: serializedLinks,
      });
    };

    api.on("update-task", handleChange, { tag });
    api.on("add-task", handleChange, { tag });
    api.on("delete-task", handleChange, { tag });
    api.on("add-link", handleChange, { tag });
    api.on("delete-link", handleChange, { tag });
    api.on("move-task", handleChange, { tag });
    api.on("drag-task", handleChange, { tag });

    return () => {
      api.detach(tag);
    };
  }, [api, saveToShape, shapeId]);

  if (!props) return null;

  return (
    <div
      className={colorScheme ? `gantt-scheme-${colorScheme}` : undefined}
      style={{ width: "100%", height: "100%" }}
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
      <GanttErrorBoundary>
        <Willow>
          {isEditing ? (
            <>
              <ContextMenu api={api ?? undefined}>
                <Tooltip api={api ?? undefined}>
                  <Gantt
                    tasks={tasks}
                    links={links}
                    scales={smartScales}
                    columns={columns}
                    start={chartStart}
                    end={chartEnd}
                    taskTypes={GANTT_TASK_TYPES}
                    init={(a: IApi) => setApi(a)}
                  />
                </Tooltip>
              </ContextMenu>
              {api && <Editor api={api} />}
            </>
          ) : (
            <Gantt
              tasks={tasks}
              links={links}
              scales={smartScales}
              columns={columns}
              start={chartStart}
              end={chartEnd}
              taskTypes={GANTT_TASK_TYPES}
              readonly={true}
            />
          )}
        </Willow>
      </GanttErrorBoundary>
    </div>
  );
}
