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
  /** 'theme' = white card with border + optional image (from themes/page)
   *  'signal' = coloured accent wrap + inner white card (from signals & theme detail) */
  style?: 'theme' | 'signal';
  title: string;
  description?: string;
  badge?: string;
  tags?: Array<{ label: string }>;
  image?: string;
  accent?: string;
  showPlay?: boolean;
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

// ── Sub-components ──────────────────────────────────────────────────────────

function Pill({ children, bg }: { children: React.ReactNode; bg?: string }) {
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
        backgroundColor: bg ?? "white",
        border: bg ? "none" : "1px solid #e0e2e8",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </span>
  );
}

function PlayButton({ accent }: { accent: string }) {
  return (
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: "50%",
        backgroundColor: "#BADEB1",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {/* play triangle */}
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <polygon points="3,1 11,6 3,11" fill="#222428" />
      </svg>
    </div>
  );
}

// ── Theme-style card (white, border, optional image, tags, meta) ─────────────

function ThemeCard({ card }: { card: InsightCardData }) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: "1px solid #e0e2e8",
        backgroundColor: "white",
        overflow: "hidden",
        fontFamily: "sans-serif",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image */}
      {card.image && (
        <div style={{ width: "100%", height: 120, overflow: "hidden", backgroundColor: card.accent ?? "#C6DCFF", flexShrink: 0 }}>
          <img src={card.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        </div>
      )}

      <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {/* Tags */}
        {card.tags && card.tags.length > 0 && (
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {card.tags.map((tag) => (
              <span
                key={tag.label}
                style={{
                  padding: "3px 10px",
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

        {/* Title */}
        <p style={{ fontSize: 15, fontWeight: 600, color: "#222428", lineHeight: 1.35, margin: 0 }}>
          {card.title}
        </p>

        {/* Description */}
        {card.description && (
          <p style={{ fontSize: 13, color: "#656b81", lineHeight: 1.5, margin: 0 }}>
            {card.description}
          </p>
        )}

        {/* Meta pills */}
        {card.meta && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
            {card.meta.arr && <Pill>{card.meta.arr}</Pill>}
            {card.meta.confidence && (
              <Pill>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ""}</Pill>
            )}
            {card.meta.likes !== undefined && <Pill>👍 {card.meta.likes}</Pill>}
            {card.meta.comments !== undefined && <Pill>💬 {card.meta.comments}</Pill>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Signal-style card (accent wrap + inner white card, badge, play button) ───

function SignalCard({ card }: { card: InsightCardData }) {
  const accent = card.accent ?? "#f1f2f5";
  return (
    <div
      style={{
        borderRadius: 16,
        backgroundColor: accent,
        padding: "2px 2px 6px 2px",
        fontFamily: "sans-serif",
        width: "100%",
        height: "100%",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          borderRadius: 14,
          backgroundColor: "white",
          padding: "14px 14px 14px 14px",
          height: "calc(100% - 8px)",
          boxSizing: "border-box",
          display: "flex",
          flexDirection: "column",
          gap: 8,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Top-right: play button */}
        {card.showPlay && (
          <div style={{ position: "absolute", top: 10, right: 10 }}>
            <PlayButton accent={accent} />
          </div>
        )}

        {/* Badge */}
        {card.badge && (
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              height: 20,
              padding: "0 8px",
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
        <p style={{ fontSize: 15, fontWeight: 600, color: "#222428", lineHeight: 1.35, margin: 0, paddingRight: card.showPlay ? 36 : 0 }}>
          {card.title}
        </p>

        {/* Description / quote */}
        {card.description && (
          <p style={{ fontSize: 13, color: "#656b81", lineHeight: 1.5, margin: 0 }}>
            {card.description}
          </p>
        )}

        {/* Meta pills */}
        {card.meta && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: "auto" }}>
            {card.meta.person && <Pill>{card.meta.person}</Pill>}
            {card.meta.company && <Pill>{card.meta.company}</Pill>}
            {card.meta.source && <Pill>{card.meta.source}</Pill>}
            {card.meta.date && <Pill>{card.meta.date}</Pill>}
            {card.meta.arr && <Pill>{card.meta.arr}</Pill>}
            {card.meta.confidence && (
              <Pill>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ""}</Pill>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Shape util ───────────────────────────────────────────────────────────────

export class InsightCardShapeUtil extends ShapeUtil<IInsightCardShape> {
  static override type = INSIGHT_CARD_SHAPE_TYPE;

  static override props: RecordProps<IInsightCardShape> = {
    w: T.number,
    h: T.number,
    card: T.any,
  };

  override getDefaultProps() {
    return { w: 280, h: 200, card: { title: "Insight" } as InsightCardData };
  }

  override getGeometry(shape: IInsightCardShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightCardShape) {
    const { card, w, h } = shape.props;
    return (
      <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: "all" }}>
        {card.style === 'theme'
          ? <ThemeCard card={card} />
          : <SignalCard card={card} />
        }
      </HTMLContainer>
    );
  }

  override indicator(shape: IInsightCardShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }

  override onResize(shape: IInsightCardShape, info: TLResizeInfo<IInsightCardShape>) {
    return resizeBox(shape, info);
  }
}
