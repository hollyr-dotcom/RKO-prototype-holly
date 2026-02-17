"use client";

import { useState, useEffect, useCallback } from "react";
import type { Editor as TLEditor, TLShapeId } from "tldraw";
import { GanttInteractive } from "./GanttInteractive";

// ── Focus Panel ──

export function GanttChartFocusPanel({
  shapeId,
  editor,
}: {
  shapeId: string;
  editor: TLEditor;
}) {
  const [titleDraft, setTitleDraft] = useState("");

  // Read shape props
  const shape = editor.getShape(shapeId as TLShapeId);
  const props = shape?.props as
    | {
        title: string;
      }
    | undefined;

  // Init title draft
  useEffect(() => {
    if (props?.title) {
      setTitleDraft(props.title);
    }
  }, [props?.title]);

  // Save title back to shape
  const commitTitle = useCallback(() => {
    const trimmed = titleDraft.trim();
    if (!trimmed || trimmed === props?.title) return;
    if (!editor || !shapeId) return;
    const currentShape = editor.getShape(shapeId as TLShapeId);
    if (!currentShape) return;

    editor.updateShape({
      id: currentShape.id,
      type: "ganttchart",
      props: {
        ...(currentShape.props as Record<string, unknown>),
        title: trimmed,
      },
    } as any);
  }, [titleDraft, props?.title, editor, shapeId]);

  if (!props) return null;

  return (
    <div
      className="gantt-focus-panel"
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "#ffffff",
      }}
    >
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

      {/* Interactive Gantt */}
      <div style={{ flex: 1, overflow: "hidden" }}>
        <GanttInteractive
          shapeId={shapeId}
          editor={editor}
          isEditing={true}
        />
      </div>
    </div>
  );
}
