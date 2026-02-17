"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  return raw.map((t) => ({
    ...t,
    start: new Date(t.start),
    end: new Date(t.end),
  }));
}

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
    progress: (t.progress as number) ?? 0,
    parent: (t.parent as number) ?? 0,
    type: (t.type as string) ?? "task",
    open: (t.open as boolean) ?? true,
  }));
}

// ── Shared Interactive Gantt Component ──

export function GanttInteractive({
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
  const scales = (props?.scales ?? []) as GanttScale[];
  const columns = (props?.columns ?? []) as GanttColumn[];

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
      <Willow>
        {isEditing ? (
          <>
            <ContextMenu api={api ?? undefined}>
              <Tooltip api={api ?? undefined}>
                <Gantt
                  tasks={tasks}
                  links={links}
                  scales={scales}
                  columns={columns}
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
            scales={scales}
            columns={columns}
            readonly={true}
          />
        )}
      </Willow>
    </div>
  );
}
