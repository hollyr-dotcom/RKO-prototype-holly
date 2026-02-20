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
const SLACK_BG = "#F9F5F9";

// Simplified Slack hash logo in brand colors
function SlackLogo({ size }: { size: number }) {
  const s = size / 24;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Top-left: blue-green */}
      <rect x={1 * s} y={5 * s} width={3.5 * s} height={8 * s} rx={1.75 * s} fill="#36C5F0" transform={`translate(${(24 - 24 * s) / 2} ${(24 - 24 * s) / 2})`} />
      {/* Actually, let's do the official-ish Slack mark */}
      <g transform={`scale(${size / 24})`}>
        {/* E4 green */}
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#2EB67D"/>
        {/* E1 blue */}
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.833 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        {/* Yellow */}
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.52A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#ECB22E"/>
        {/* Red */}
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </g>
    </svg>
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
      w: 320,
      h: 200,
      title: "Slack Message",
      description: "",
      fields: [],
    };
  }

  override canEdit() { return false; }
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
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const { title, description } = shape.props;
    const fields = (shape.props.fields ?? []) as Array<{ label: string; value: string }>;

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 16,
          border: `1px solid ${isSelected ? SLACK_PURPLE : "#e5e7eb"}`,
          background: "#ffffff",
          boxShadow: isSelected
            ? `0 4px 12px rgba(74, 21, 75, 0.12)`
            : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
          pointerEvents: "all",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Slack logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: SLACK_BG,
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

        {/* Content */}
        <div
          style={{
            padding: 16,
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
            overflow: "hidden",
          }}
        >
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

          {description && (
            <div
              style={{
                fontSize: 12,
                color: "#6B7280",
                lineHeight: "16px",
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {description}
            </div>
          )}

          {/* Fields */}
          {fields.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 4 }}>
              {fields.slice(0, 4).map((field, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    fontSize: 11,
                    lineHeight: "16px",
                  }}
                >
                  <span style={{ color: "#9CA3AF", fontWeight: 500 }}>{field.label}</span>
                  <span style={{ color: "#374151", fontWeight: 500 }}>{field.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: ISlackCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
