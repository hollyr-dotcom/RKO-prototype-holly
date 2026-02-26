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

export const WORKDAY_CARD_SHAPE_TYPE = "workday-card" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [WORKDAY_CARD_SHAPE_TYPE]: {
      w: number;
      h: number;
      title: string;
      description: string;
      fields: unknown;
    };
  }
}

type IWorkdayCardShape = TLShape<typeof WORKDAY_CARD_SHAPE_TYPE>;

// Workday brand orange
const WORKDAY_ORANGE = "#F68D2E";
const WORKDAY_BG = "#FFF8F1";

function WorkdayLogo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill={WORKDAY_ORANGE} />
      <path
        d="M8.5 20.5C8.5 20.5 10.5 11 16 11C21.5 11 23.5 20.5 23.5 20.5"
        stroke="white"
        strokeWidth="2.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="14.5" r="1.5" fill="white" />
      <circle cx="20" cy="14.5" r="1.5" fill="white" />
    </svg>
  );
}

export class WorkdayCardShapeUtil extends ShapeUtil<IWorkdayCardShape> {
  static override type = WORKDAY_CARD_SHAPE_TYPE;
  static override props: RecordProps<IWorkdayCardShape> = {
    w: T.number,
    h: T.number,
    title: T.string,
    description: T.string,
    fields: T.jsonValue,
  };

  getDefaultProps(): IWorkdayCardShape["props"] {
    return {
      w: 320,
      h: 200,
      title: "Workday Record",
      description: "",
      fields: [],
    };
  }

  override canEdit() { return false; }
  override canScroll() { return false; }
  override canResize() { return true; }
  override isAspectRatioLocked() { return false; }

  getGeometry(shape: IWorkdayCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: IWorkdayCardShape, info: TLResizeInfo<IWorkdayCardShape>) {
    return resizeBox(shape, info);
  }

  component(shape: IWorkdayCardShape) {
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
          border: `1px solid ${isSelected ? WORKDAY_ORANGE : "var(--color-gray-200)"}`,
          background: "#ffffff",
          boxShadow: isSelected
            ? `0 4px 12px rgba(246, 141, 46, 0.15)`
            : "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.03)",
          pointerEvents: "all",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Header with Workday logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "12px 16px",
            borderBottom: "1px solid #f0f0f0",
            background: WORKDAY_BG,
          }}
        >
          <WorkdayLogo size={24} />
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: WORKDAY_ORANGE,
              letterSpacing: "0.01em",
            }}
          >
            Workday
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

          {description && (
            <div
              style={{
                fontSize: 12,
                color: "var(--color-gray-500)",
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
                  <span style={{ color: "var(--color-gray-400)", fontWeight: 500 }}>{field.label}</span>
                  <span style={{ color: "var(--color-gray-700)", fontWeight: 500 }}>{field.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </HTMLContainer>
    );
  }

  indicator(shape: IWorkdayCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} ry={16} />;
  }
}
