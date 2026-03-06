"use client";

import React from "react";
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

export const INSIGHT_CARD_SHAPE_TYPE = "insight-card" as const;

export interface InsightCardData {
  title: string;
  description?: string;
  badge?: string;
  tags?: Array<{ label: string }>;
  accent?: string;
  meta?: {
    arr?: string;
    confidence?: string;
    confidenceDelta?: string;
    likes?: number;
    comments?: number;
    person?: string;
    company?: string;
    source?: string;
    date?: string;
  };
}

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [INSIGHT_CARD_SHAPE_TYPE]: {
      w: number;
      h: number;
      card: InsightCardData;
    };
  }
}

type IInsightCardShape = TLShape<typeof INSIGHT_CARD_SHAPE_TYPE>;

const TAG_BG: Record<string, string> = {
  New: "#BADEB1",
  Urgent: "#FFD8F4",
  Customer: "#FFF6B6",
  Market: "#C6DCFF",
  Strengthening: "#F8D3AF",
  Weakening: "#f1f2f5",
};

export class InsightCardShapeUtil extends ShapeUtil<IInsightCardShape> {
  static override type = INSIGHT_CARD_SHAPE_TYPE;

  static override props: RecordProps<IInsightCardShape> = {
    w: T.number,
    h: T.number,
    card: T.any,
  };

  override getDefaultProps() {
    return {
      w: 280,
      h: 180,
      card: { title: "Insight" } as InsightCardData,
    };
  }

  override getGeometry(shape: IInsightCardShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override component(shape: IInsightCardShape) {
    const { card } = shape.props;
    const accent = card.accent ?? "#f1f2f5";

    return (
      <HTMLContainer
        id={shape.id}
        style={{ width: shape.props.w, height: shape.props.h, pointerEvents: "all" }}
      >
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: 14,
            backgroundColor: accent,
            padding: "2px 2px 6px 2px",
            boxSizing: "border-box",
            fontFamily: "sans-serif",
          }}
        >
          <div
            style={{
              borderRadius: 12,
              backgroundColor: "white",
              padding: "12px 14px",
              height: "100%",
              boxSizing: "border-box",
              display: "flex",
              flexDirection: "column",
              gap: 6,
              overflow: "hidden",
            }}
          >
            {/* Tags (theme cards) */}
            {card.tags && card.tags.length > 0 && (
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                {card.tags.map((tag) => (
                  <span
                    key={tag.label}
                    style={{
                      padding: "2px 8px",
                      borderRadius: 99,
                      fontSize: 11,
                      color: "#222428",
                      backgroundColor: TAG_BG[tag.label] ?? "#f1f2f5",
                    }}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            )}

            {/* Badge (signal/featured cards) */}
            {card.badge && !card.tags?.length && (
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  padding: "2px 8px",
                  borderRadius: 99,
                  fontSize: 10,
                  fontWeight: 500,
                  color: "white",
                  backgroundColor: "#222428",
                  width: "fit-content",
                }}
              >
                {card.badge}
              </span>
            )}

            {/* Title */}
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#222428",
                lineHeight: 1.35,
                margin: 0,
              }}
            >
              {card.title}
            </p>

            {/* Description */}
            {card.description && (
              <p
                style={{
                  fontSize: 12,
                  color: "#656b81",
                  lineHeight: 1.5,
                  margin: 0,
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                }}
              >
                {card.description}
              </p>
            )}

            {/* Meta pills */}
            {card.meta && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: "auto" }}>
                {card.meta.arr && (
                  <Pill>{card.meta.arr}</Pill>
                )}
                {card.meta.confidence && (
                  <Pill>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ""}</Pill>
                )}
                {card.meta.person && <Pill>{card.meta.person}</Pill>}
                {card.meta.company && <Pill>{card.meta.company}</Pill>}
                {card.meta.source && <Pill>{card.meta.source}</Pill>}
                {card.meta.date && <Pill>{card.meta.date}</Pill>}
              </div>
            )}
          </div>
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: IInsightCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={14} />;
  }

  override onResize(shape: IInsightCardShape, info: TLResizeInfo<IInsightCardShape>) {
    return resizeBox(shape, info);
  }
}

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        height: 22,
        padding: "0 8px",
        borderRadius: 99,
        fontSize: 11,
        color: "#222428",
        backgroundColor: "white",
        border: "1px solid #e0e2e8",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}
