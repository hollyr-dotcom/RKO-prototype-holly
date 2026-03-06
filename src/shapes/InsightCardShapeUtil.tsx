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
  style?: 'theme' | 'featured';
  cardType?: 'audio' | 'quote';
  title: string;
  description?: string;
  quote?: string;
  badge?: string;
  tags?: Array<{ label: string }>;
  image?: string;
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
  New: "#BADEB1", Urgent: "#FFD8F4", Customer: "#FFF6B6",
  Market: "#C6DCFF", Strengthening: "#F8D3AF", Weakening: "#f1f2f5",
};

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 4,
      padding: "4px 10px", borderRadius: 99, fontSize: 11,
      color: "#222428", backgroundColor: "#e9eaef", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

export class InsightCardShapeUtil extends ShapeUtil<IInsightCardShape> {
  static override type = INSIGHT_CARD_SHAPE_TYPE;

  static override props: RecordProps<IInsightCardShape> = {
    w: T.number,
    h: T.number,
    card: T.any,
  };

  override getDefaultProps() {
    return { w: 260, h: 380, card: { title: "Insight" } as InsightCardData };
  }

  override getGeometry(shape: IInsightCardShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightCardShape) {
    const { card, w, h } = shape.props;
    const accent = card.accent ?? "#DEDAFF";
    const isAudio = card.cardType === 'audio';
    const isQuote = card.cardType === 'quote';
    const mediaH = isQuote ? 200 : 150;

    if (card.style === 'theme') {
      // ── Theme card: white with border, optional image, tags, meta ──
      return (
        <HTMLContainer id={shape.id} style={{
          width: w, height: h, borderRadius: 16,
          border: "1px solid #e0e2e8", backgroundColor: "white",
          overflow: "hidden", fontFamily: "sans-serif",
          display: "flex", flexDirection: "column", pointerEvents: "all",
        }}>
          {card.image && (
            <div style={{ width: "100%", height: 120, overflow: "hidden", backgroundColor: accent, flexShrink: 0 }}>
              <img src={card.image} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            </div>
          )}
          <div style={{ padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
            {card.tags && card.tags.length > 0 && (
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {card.tags.map((tag) => (
                  <span key={tag.label} style={{ padding: "3px 10px", borderRadius: 99, fontSize: 11, color: "#222428", backgroundColor: TAG_BG[tag.label] ?? "#f1f2f5" }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            )}
            <p style={{ fontSize: 15, fontWeight: 600, color: "#222428", lineHeight: 1.35, margin: 0 }}>{card.title}</p>
            {card.description && (
              <p style={{ fontSize: 13, color: "#656b81", lineHeight: 1.5, margin: 0 }}>{card.description}</p>
            )}
            {card.meta && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                {card.meta.arr && <Chip>{card.meta.arr}</Chip>}
                {card.meta.confidence && <Chip>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ""}</Chip>}
                {card.meta.likes !== undefined && <Chip>👍 {card.meta.likes}</Chip>}
                {card.meta.comments !== undefined && <Chip>💬 {card.meta.comments}</Chip>}
              </div>
            )}
          </div>
        </HTMLContainer>
      );
    }

    // ── Featured card: matches FeaturedCard component on the page exactly ──
    return (
      <HTMLContainer id={shape.id} style={{
        width: w, height: h, borderRadius: 16,
        backgroundColor: accent + "66",
        padding: "2px 2px 6px 2px",
        boxSizing: "border-box",
        fontFamily: "sans-serif",
        pointerEvents: "all",
      }}>
        {/* Inner white card */}
        <div style={{
          borderRadius: 16, backgroundColor: "white",
          width: w - 4, height: h - 8,
          display: "flex", flexDirection: "column", gap: 10, padding: 20,
          boxSizing: "border-box", position: "relative", overflow: "hidden",
        }}>
          {/* Sparkle button top-right */}
          <div style={{
            position: "absolute", top: 10, right: 10,
            width: 26, height: 26, borderRadius: "50%",
            border: "1px solid #e0e2e8", backgroundColor: "white",
            display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1,
          }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="#656b81">
              <path d="M8 1.5l1.6 4.9H15l-4.2 3 1.6 4.9L8 11.3l-4.4 3.1 1.6-4.9L1 7.4h5.4z"/>
            </svg>
          </div>

          {/* Gradient media area — matches the page exactly */}
          <div style={{
            borderRadius: 12, overflow: "hidden", flexShrink: 0, height: mediaH,
            background: `linear-gradient(to bottom, ${accent}, white)`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 10, padding: "16px 20px", boxSizing: "border-box",
          }}>
            {isAudio && (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: accent,
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                {/* CSS play triangle — SVG fill unreliable in tldraw HTML canvas */}
                <div style={{
                  marginLeft: 3,
                  width: 0,
                  height: 0,
                  borderTop: "7px solid transparent",
                  borderBottom: "7px solid transparent",
                  borderLeft: "12px solid #222428",
                }} />
              </div>
            )}
            {isQuote && card.quote && (
              <p style={{ fontSize: 13, fontWeight: 600, color: "#222428", textAlign: "center", lineHeight: 1.4, margin: 0 }}>
                {card.quote}
              </p>
            )}
          </div>

          {/* Content below media */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5, flex: 1, minHeight: 0 }}>
            {isAudio && card.badge && (
              <span style={{
                display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px",
                borderRadius: 99, fontSize: 10, fontWeight: 500,
                color: "white", backgroundColor: "#222428", width: "fit-content",
              }}>
                {card.badge}
              </span>
            )}
            <p style={{ fontSize: 16, fontWeight: 600, color: "#222428", lineHeight: 1.35, margin: 0 }}>
              {card.title}
            </p>
            {card.description && (
              <p style={{ fontSize: 12, color: "#656b81", lineHeight: 1.4, margin: 0 }}>
                {card.description}
              </p>
            )}
            {isQuote && card.meta?.person && (
              <p style={{ fontSize: 12, color: "#9ca0ad", margin: 0 }}>{card.meta.person}</p>
            )}
          </div>

          {/* Meta pills — always visible on canvas (hover-only on page) */}
          {card.meta && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, flexShrink: 0 }}>
              {card.meta.source && <Chip>{card.meta.source}</Chip>}
              {card.meta.company && <Chip>{card.meta.company}</Chip>}
              {!isQuote && card.meta.person && <Chip>{card.meta.person}</Chip>}
              {card.meta.date && <Chip>{card.meta.date}</Chip>}
            </div>
          )}
        </div>
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
