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

export const INSIGHT_TABLE_SHAPE_TYPE = "insight-table" as const;

export interface InsightTableRow {
  title: string;
  description?: string;
  type?: string;
  company?: string;
  date?: string;
  tags?: string[];
  arr?: string;
}

export interface InsightTableData {
  heading: string;
  rows: InsightTableRow[];
}

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [INSIGHT_TABLE_SHAPE_TYPE]: {
      w: number;
      h: number;
      table: InsightTableData;
    };
  }
}

type IInsightTableShape = TLShape<typeof INSIGHT_TABLE_SHAPE_TYPE>;

// Company → pill colour
const COMPANY_COLORS: Record<string, { bg: string; color: string }> = {
  Figma:      { bg: "#C6DCFF", color: "#222428" },
  Siemens:    { bg: "#e0e0e0", color: "#222428" },
  Spotify:    { bg: "#BADEB1", color: "#222428" },
  Apple:      { bg: "#e9eaef", color: "#222428" },
  Adobe:      { bg: "#FFD8F4", color: "#222428" },
  Atlassian:  { bg: "#FFF6B6", color: "#222428" },
  Miro:       { bg: "#DEDAFF", color: "#222428" },
  Notion:     { bg: "#F8D3AF", color: "#222428" },
  Brex:       { bg: "#FFD8F4", color: "#222428" },
  Google:     { bg: "#C6DCFF", color: "#222428" },
  Navan:      { bg: "#BADEB1", color: "#222428" },
};

const TAG_BG: Record<string, string> = {
  New: "#BADEB1", Urgent: "#FFD8F4", Customer: "#FFF6B6",
  Market: "#C6DCFF", Strengthening: "#F8D3AF", Weakening: "#f1f2f5",
};

const TYPE_LABEL: Record<string, string> = {
  audio: "Audio", quote: "Quote", theme: "Theme", clips: "Clip",
};

// Column widths
const COL_NUM  = 44;
const COL_TITLE = 220;
const COL_TYPE  = 72;
const COL_CO    = 120;
const COL_META  = 100; // ARR or date

const ROW_H = 92;
const HEADER_H = 44;
const BORDER = "1px solid #e0e2e8";

function HeaderCell({ label, icon, flex }: { label: string; icon: React.ReactNode; flex?: boolean }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 6,
      padding: "0 8px", height: HEADER_H,
      borderRight: BORDER,
      ...(flex ? { flex: 1, minWidth: 0 } : {}),
    }}>
      <span style={{ color: "#9ca0ad", flexShrink: 0, display: "flex" }}>{icon}</span>
      <span style={{
        fontSize: 12, fontWeight: 600, color: "#656b81",
        overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
      }}>
        {label}
      </span>
    </div>
  );
}

export class InsightTableShapeUtil extends ShapeUtil<IInsightTableShape> {
  static override type = INSIGHT_TABLE_SHAPE_TYPE;

  static override props: RecordProps<IInsightTableShape> = {
    w: T.number,
    h: T.number,
    table: T.any,
  };

  override getDefaultProps() {
    return { w: 600, h: 320, table: { heading: "Related", rows: [] } as InsightTableData };
  }

  override getGeometry(shape: IInsightTableShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightTableShape) {
    const { table, w, h } = shape.props;

    // Icon SVGs (inline, no external deps)
    const iconText = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="2" rx="1" fill="#9ca0ad"/>
        <rect x="2" y="7" width="12" height="2" rx="1" fill="#9ca0ad"/>
        <rect x="2" y="11" width="8" height="2" rx="1" fill="#9ca0ad"/>
      </svg>
    );
    const iconHash = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <text x="2" y="12" fontSize="13" fill="#9ca0ad" fontWeight="600">#</text>
      </svg>
    );
    const iconTag = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M2 2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 010 1.414l-4.586 4.586a1 1 0 01-1.414 0L2.293 8.293A1 1 0 012 7.586V2z" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
        <circle cx="5.5" cy="5.5" r="1" fill="#9ca0ad"/>
      </svg>
    );
    const iconCalendar = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
        <path d="M5 2v2M11 2v2M2 7h12" stroke="#9ca0ad" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    );
    const iconBookmark = (
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M4 2h8a1 1 0 011 1v10l-5-3-5 3V3a1 1 0 011-1z" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
      </svg>
    );

    return (
      <HTMLContainer id={shape.id} style={{
        width: w, height: h,
        backgroundColor: "white",
        border: BORDER,
        borderRadius: 8,
        fontFamily: "sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "all",
      }}>
        {/* Heading bar */}
        <div style={{
          padding: "10px 14px",
          fontSize: 12,
          fontWeight: 700,
          color: "#222428",
          borderBottom: BORDER,
          backgroundColor: "#fbfbfc",
          flexShrink: 0,
          letterSpacing: "0.01em",
        }}>
          {table.heading}
        </div>

        {/* Header row */}
        <div style={{
          display: "flex",
          borderBottom: BORDER,
          backgroundColor: "white",
          flexShrink: 0,
        }}>
          {/* Row number column */}
          <div style={{ width: COL_NUM, borderRight: BORDER, flexShrink: 0 }} />
          <HeaderCell label="Signal" icon={iconBookmark} flex />
          <div style={{ width: COL_TYPE, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <span style={{ color: "#9ca0ad", display: "flex" }}>{iconTag}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Type</span>
          </div>
          <div style={{ width: COL_CO, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <span style={{ color: "#9ca0ad", display: "flex" }}>{iconText}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Company</span>
          </div>
          <div style={{ width: COL_META, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H }}>
            <span style={{ color: "#9ca0ad", display: "flex" }}>{iconCalendar}</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Date</span>
          </div>
        </div>

        {/* Data rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {table.rows.map((row, i) => {
            const compColor = COMPANY_COLORS[row.company ?? ""] ?? { bg: "#e9eaef", color: "#222428" };
            const isLast = i === table.rows.length - 1;
            return (
              <div key={i} style={{
                display: "flex",
                borderBottom: isLast ? "none" : BORDER,
                minHeight: ROW_H,
                alignItems: "stretch",
              }}>
                {/* Row number */}
                <div style={{
                  width: COL_NUM, flexShrink: 0, borderRight: BORDER,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, color: "#9ca0ad",
                }}>
                  {i + 1}
                </div>

                {/* Title + tags */}
                <div style={{
                  flex: 1, minWidth: 0, borderRight: BORDER,
                  padding: "10px 10px",
                  display: "flex", flexDirection: "column", justifyContent: "center", gap: 5,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "#222428",
                    lineHeight: 1.35,
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical" as const,
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}>
                    {row.title}
                  </span>
                  {row.tags && row.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                      {row.tags.slice(0, 2).map(tag => (
                        <span key={tag} style={{
                          fontSize: 10, padding: "2px 7px", borderRadius: 99,
                          backgroundColor: TAG_BG[tag] ?? "#f1f2f5", color: "#222428",
                        }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {row.arr && (
                    <span style={{ fontSize: 11, color: "#656b81" }}>{row.arr}</span>
                  )}
                </div>

                {/* Type */}
                <div style={{
                  width: COL_TYPE, flexShrink: 0, borderRight: BORDER,
                  display: "flex", alignItems: "center", padding: "0 8px",
                }}>
                  <span style={{ fontSize: 12, color: "#656b81" }}>
                    {row.type ? (TYPE_LABEL[row.type] ?? row.type) : "—"}
                  </span>
                </div>

                {/* Company pill */}
                <div style={{
                  width: COL_CO, flexShrink: 0, borderRight: BORDER,
                  display: "flex", alignItems: "center", padding: "0 8px",
                }}>
                  {row.company ? (
                    <span style={{
                      fontSize: 11, padding: "3px 8px", borderRadius: 99,
                      backgroundColor: compColor.bg, color: compColor.color,
                      whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "100%",
                    }}>
                      {row.company}
                    </span>
                  ) : (
                    <span style={{ fontSize: 12, color: "#9ca0ad" }}>—</span>
                  )}
                </div>

                {/* Date */}
                <div style={{
                  width: COL_META, flexShrink: 0,
                  display: "flex", alignItems: "center", padding: "0 8px",
                }}>
                  <span style={{ fontSize: 12, color: "#9ca0ad" }}>{row.date ?? "—"}</span>
                </div>
              </div>
            );
          })}
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: IInsightTableShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={8} />;
  }

  override onResize(shape: IInsightTableShape, info: TLResizeInfo<IInsightTableShape>) {
    return resizeBox(shape, info);
  }
}
