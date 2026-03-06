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
    return { w: 300, h: 440, card: { title: "Insight" } as InsightCardData };
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
      // ── Theme card: matches chat card design — colored border wrapper, inner white card ──
      const tagColor = TAG_BG[card.tags?.[0]?.label ?? ''] ?? '#E7E7E5';
      return (
        <HTMLContainer id={shape.id} style={{
          width: w, height: h, borderRadius: 18,
          backgroundColor: tagColor + '99',
          padding: '3px 3px 6px 3px',
          boxSizing: 'border-box',
          fontFamily: 'sans-serif',
          pointerEvents: 'all',
          position: 'relative',
        }}>
          {/* Three-dot button */}
          <div style={{ position: 'absolute', top: 10, right: 10, zIndex: 10 }}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#aeb2c0',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
              </svg>
            </div>
          </div>
          {/* Inner white card */}
          <div style={{
            borderRadius: 14, backgroundColor: 'white',
            width: '100%', height: '100%',
            display: 'flex', flexDirection: 'column',
            boxSizing: 'border-box', overflow: 'hidden',
          }}>
            {card.image && (
              <div style={{ width: '100%', height: 120, overflow: 'hidden', backgroundColor: tagColor, flexShrink: 0 }}>
                <img src={card.image} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
              {card.tags && card.tags.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {card.tags.map((tag) => (
                    <span key={tag.label} style={{ padding: '3px 10px', borderRadius: 99, fontSize: 11, color: '#222428', backgroundColor: TAG_BG[tag.label] ?? '#f1f2f5' }}>
                      {tag.label}
                    </span>
                  ))}
                </div>
              )}
              <p style={{ fontSize: 15, fontWeight: 600, color: '#222428', lineHeight: 1.35, margin: 0 }}>{card.title}</p>
              {card.description && (
                <p style={{ fontSize: 13, color: '#656b81', lineHeight: 1.5, margin: 0 }}>{card.description}</p>
              )}
              {card.meta && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                  {card.meta.arr && <Chip>{card.meta.arr}</Chip>}
                  {card.meta.confidence && <Chip>{card.meta.confidence}{card.meta.confidenceDelta ? ` ${card.meta.confidenceDelta}` : ''}</Chip>}
                  {card.meta.likes !== undefined && (
                    <Chip>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>
                      {card.meta.likes}
                    </Chip>
                  )}
                  {card.meta.comments !== undefined && (
                    <Chip>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M20 12a8 8 0 1 0-14.953 3.959l.137.23.103.822-.764 2.457 2.431-.77.83.103.282.167A7.965 7.965 0 0 0 12 20a8 8 0 0 0 8-8Zm2 0c0 5.523-4.477 10-10 10a9.971 9.971 0 0 1-4.864-1.263l-3.833 1.216-1.258-1.25 1.201-3.867A9.958 9.958 0 0 1 2 12C2 6.477 6.477 2 12 2s10 4.477 10 10ZM7 11h2v2H7v-2Zm4 0h2v2h-2v-2Zm4 0h2v2h-2v-2Z"/></svg>
                      {card.meta.comments}
                    </Chip>
                  )}
                </div>
              )}
            </div>
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
          width: w - 4,
          display: "flex", flexDirection: "column", gap: 10, padding: 20,
          boxSizing: "border-box", position: "relative", overflow: "hidden",
        }}>

          {/* Gradient media area — matches the page exactly */}
          <div style={{
            borderRadius: 12, overflow: "hidden", flexShrink: 0, height: mediaH,
            background: `linear-gradient(to bottom, ${accent}, white)`,
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: 10, padding: "16px 20px", boxSizing: "border-box",
          }}>
            {/* Show play button for audio cards, or any featured card that isn't a quote */}
            {!isQuote && (
              <div style={{
                width: 36, height: 36, borderRadius: "50%",
                backgroundColor: accent,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}>
                <span style={{ fontSize: 14, color: "#222428", lineHeight: 1, marginLeft: 2 }}>▶</span>
              </div>
            )}
            {isQuote && card.quote && (
              <p style={{ fontSize: 13, fontWeight: 600, color: "#222428", textAlign: "center", lineHeight: 1.4, margin: 0 }}>
                {card.quote}
              </p>
            )}
          </div>

          {/* Content below media */}
          <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
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
            {card.description && !isQuote && (
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
