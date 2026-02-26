"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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

export const SLACK_CARD_SHAPE_TYPE = "slack-card" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [SLACK_CARD_SHAPE_TYPE]: {
      w: number;
      h: number;
      title: string;
      description: string;
      fields: unknown;
    };
  }
}

type ISlackCardShape = TLShape<typeof SLACK_CARD_SHAPE_TYPE>;

const SLACK_PURPLE = "#4A154B";

// Official Slack logo mark
function SlackLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <g transform={`scale(${size / 24})`}>
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#2EB67D"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.833 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.52A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#ECB22E"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </g>
    </svg>
  );
}

// Parse @mentions into styled inline spans
function parseMentions(text: string): React.ReactNode[] {
  const parts = text.split(/(@\w+)/g);
  return parts.map((part, i) =>
    /^@\w+$/.test(part) ? (
      <span
        key={i}
        style={{
          color: "#1264A3",
          background: "rgba(29, 155, 209, 0.1)",
          borderRadius: 3,
          padding: "1px 3px",
        }}
      >
        {part}
      </span>
    ) : (
      part
    )
  );
}

// Editable title component used inside the shape
function EditableTitle({
  value,
  isEditing,
  onCommit,
}: {
  value: string;
  isEditing: boolean;
  onCommit: (newTitle: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Sync draft when value changes externally
  useEffect(() => {
    if (!isEditing) setDraft(value);
  }, [value, isEditing]);

  // Auto-focus when entering edit mode
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const commit = useCallback(() => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) {
      onCommit(trimmed);
    } else {
      setDraft(value);
    }
  }, [draft, value, onCommit]);

  if (!isEditing) {
    return (
      <div
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: "var(--color-gray-900)",
          lineHeight: "20px",
          wordBreak: "break-word",
          whiteSpace: "pre-wrap",
        }}
      >
        {value ? parseMentions(value) : "Untitled"}
      </div>
    );
  }

  return (
    <textarea
      ref={inputRef}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          inputRef.current?.blur();
        }
        e.stopPropagation();
      }}
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        fontSize: 14,
        fontWeight: 600,
        color: "var(--color-gray-900)",
        lineHeight: "20px",
        background: "transparent",
        border: "none",
        outline: "none",
        resize: "none",
        padding: 0,
        margin: 0,
        width: "100%",
        fontFamily: "inherit",
        overflow: "hidden",
        wordBreak: "break-word",
      }}
      rows={2}
    />
  );
}

export class SlackCardShapeUtil extends ShapeUtil<ISlackCardShape> {
  static override type = SLACK_CARD_SHAPE_TYPE;
  static override props: RecordProps<ISlackCardShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    description: T.string,
    fields: T.jsonValue,
  };

  getDefaultProps(): ISlackCardShape["props"] {
    return {
      w: 288,
      h: 120,
      title: "Slack Message",
      description: "",
      fields: [],
    };
  }

  override canEdit() { return true; }
  override canScroll() { return false; }
  override canResize() { return true; }
  override isAspectRatioLocked() { return false; }

  getGeometry(shape: ISlackCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: ISlackCardShape, info: TLResizeInfo<ISlackCardShape>) {
    return resizeBox(shape, info);
  }

  component(shape: ISlackCardShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const isConnected = !!(shape.meta as Record<string, unknown>)?.isConnected;
    const { title } = shape.props;
    const editor = this.editor;

    const borderColor = isConnected || isSelected ? "#7C3AED" : "var(--color-gray-200)";
    const shadow = isConnected
      ? undefined // handled by CSS animation
      : isSelected
        ? "0 4px 12px rgba(74, 21, 75, 0.12)"
        : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)";

    return (
      <HTMLContainer
        className={isConnected ? "connected-shape-glow" : undefined}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 16,
          border: `1.5px solid ${borderColor}`,
          background: "#ffffff",
          boxShadow: shadow,
          pointerEvents: "all",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header: Slack logo + name */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 16px",
            flexShrink: 0,
          }}
        >
          <SlackLogo size={20} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: SLACK_PURPLE,
              letterSpacing: "0.01em",
            }}
          >
            Slack
          </span>
        </div>

        {/* Title */}
        <div
          style={{
            padding: "0 16px 16px",
            flex: 1,
            minHeight: 0,
          }}
        >
          <EditableTitle
            value={title}
            isEditing={isEditing}
            onCommit={(newTitle) => {
              editor.updateShape({
                id: shape.id,
                type: SLACK_CARD_SHAPE_TYPE,
                props: { title: newTitle },
              });
            }}
          />
        </div>

        {/* Run flow button — visible when connected via connector lines */}
        {isConnected && (
          <div
            className="animate-slideUp"
            style={{
              padding: "0 12px 10px",
              display: "flex",
              justifyContent: "flex-end",
              flexShrink: 0,
            }}
          >
            <button
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                window.dispatchEvent(
                  new CustomEvent("slack-card:run-flow", {
                    detail: { shapeId: shape.id },
                  })
                );
              }}
              style={{
                fontSize: 12,
                fontWeight: 600,
                color: "#7C3AED",
                background: "rgba(124, 58, 237, 0.08)",
                border: "1px solid rgba(124, 58, 237, 0.2)",
                borderRadius: 8,
                padding: "5px 14px",
                cursor: "pointer",
                lineHeight: "16px",
                letterSpacing: "0.01em",
              }}
            >
              Run flow
            </button>
          </div>
        )}
      </HTMLContainer>
    );
  }

  indicator(shape: ISlackCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
