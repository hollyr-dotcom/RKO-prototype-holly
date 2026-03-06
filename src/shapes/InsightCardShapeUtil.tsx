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
  /** 'theme'    = white card with border + optional image (from themes/page)
   *  'featured' = semi-transparent accent wrap, gradient media area, play/quote (from featured cards on page) */
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
  New: "#BADEB1",
  Urgent: "#FFD8F4",
  Customer: "#FFF6B6",
  Market: "#C6DCFF",
  Strengthening: "#F8D3AF",
  Weakening: "#f1f2f5",
};

function MetaPill({ children }: { children: React.ReactNode }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", height: 22, padding: "0 8px",
      borderRadius: 99, fontSize: 11, color: "#222428",
      backgroundColor: "#e9eaef", whiteSpace: "nowrap",
    }}>
      {children}
    </span>
  );
}

// ── Theme-style card ─────────────────────────────────────────────────────────
// White card with border, optional image at top, tags, title, description, meta

function ThemeCard({ card, w, h }: { card: InsightCardData; w: number; h: number }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: 16, border: "1px solid #e0e2e8",
      backgroundColor: "white", overflow: "hidden", fontFamily: "sans-serif",
      boxSizing: "border-box", display: "flex", flexDirection: "column",
    }}>
      {card.image && (
        <div style={{ width: "100%", height: 120, overflow: "hidden", backgroundColor: card.accent ?? "#C6DCFF", flexShrink: 0 }}>
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
            {card.meta.arr && <MetaPill>{card.meta.arr}</MetaPill>}
            {card.meta.confidence && <MetaPill>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ""}</MetaPill>}
            {card.meta.likes !== undefined && <MetaPill>👍 {card.meta.likes}</MetaPill>}
            {card.meta.comments !== undefined && <MetaPill>💬 {card.meta.comments}</MetaPill>}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Featured-style card ──────────────────────────────────────────────────────
// Matches the FeaturedCard component on the page exactly:
// Semi-transparent accent outer, white inner, gradient media area, play/quote, badge, title, meta

function FeaturedCard({ card, w, h }: { card: InsightCardData; w: number; h: number }) {
  const accent = card.accent ?? "#DEDAFF";
  const isAudio = card.cardType === 'audio';
  const isQuote = card.cardType === 'quote';
  const mediaH = isQuote ? 200 : 150;

  return (
    <div style={{
      width: w, height: h, borderRadius: 16,
      backgroundColor: accent + "66", // semi-transparent outer, matches accent+'66' on page
      padding: "2px 2px 6px 2px", boxSizing: "border-box", fontFamily: "sans-serif",
    }}>
      <div style={{
        borderRadius: 16, backgroundColor: "white",
        width: "100%", height: "calc(100% - 8px)",
        display: "flex", flexDirection: "column", gap: 10, padding: 20,
        boxSizing: "border-box", position: "relative", overflow: "hidden",
      }}>
        {/* Sparkle icon top-right */}
        <div style={{
          position: "absolute", top: 10, right: 10,
          width: 26, height: 26, borderRadius: "50%",
          border: "1px solid #e0e2e8", backgroundColor: "white",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="#656b81">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>

        {/* Gradient media area */}
        <div style={{
          borderRadius: 12, overflow: "hidden", flexShrink: 0, height: mediaH,
          background: `linear-gradient(to bottom, ${accent}, white)`,
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          gap: 10, padding: "16px 20px",
        }}>
          {isAudio && (
            <div style={{
              width: 36, height: 36, borderRadius: "50%",
              backgroundColor: accent,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="14" height="14" viewBox="0 0 12 14" fill="#222428">
                <polygon points="2,1 11,7 2,13" />
              </svg>
            </div>
          )}
          {isQuote && card.quote && (
            <p style={{ fontSize: 13, fontWeight: 600, color: "#222428", textAlign: "center", lineHeight: 1.4, margin: 0 }}>
              {card.quote}
            </p>
          )}
        </div>

        {/* Content below media */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
          {isAudio && card.badge && (
            <span style={{
              display: "inline-flex", alignItems: "center", height: 20, padding: "0 8px",
              borderRadius: 99, fontSize: 10, fontWeight: 500, color: "white",
              backgroundColor: "#222428", width: "fit-content",
            }}>
              {card.badge}
            </span>
          )}
          <p style={{ fontSize: 16, fontWeight: 600, color: "#222428", lineHeight: 1.35, margin: 0 }}>
            {card.title}
          </p>
          {card.description && (
            <p style={{ fontSize: 12, color: "#656b81", lineHeight: 1.4, margin: 0 }}>{card.description}</p>
          )}
          {isQuote && card.meta?.person && (
            <p style={{ fontSize: 12, color: "#9ca0ad", margin: 0 }}>{card.meta.person}</p>
          )}
        </div>

        {/* Meta pills at bottom */}
        {card.meta && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: "auto" }}>
            {card.meta.source && <MetaPill>{card.meta.source}</MetaPill>}
            {card.meta.company && <MetaPill>{card.meta.company}</MetaPill>}
            {!isQuote && card.meta.person && <MetaPill>{card.meta.person}</MetaPill>}
            {card.meta.date && <MetaPill>{card.meta.date}</MetaPill>}
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
    return { w: 260, h: 380, card: { title: "Insight" } as InsightCardData };
  }

  override getGeometry(shape: IInsightCardShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightCardShape) {
    const { card, w, h } = shape.props;
    return (
      <HTMLContainer id={shape.id} style={{ width: w, height: h, pointerEvents: "all" }}>
        {card.style === 'theme'
          ? <ThemeCard card={card} w={w} h={h} />
          : <FeaturedCard card={card} w={w} h={h} />
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
