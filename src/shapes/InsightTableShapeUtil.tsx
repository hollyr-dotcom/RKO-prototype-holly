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
  source?: string;
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

const COMPANY_COLORS: Record<string, { bg: string; color: string }> = {
  Figma:     { bg: "#C6DCFF", color: "#222428" },
  Siemens:   { bg: "#e0e0e0", color: "#222428" },
  Spotify:   { bg: "#BADEB1", color: "#222428" },
  Apple:     { bg: "#e9eaef", color: "#222428" },
  Adobe:     { bg: "#FFD8F4", color: "#222428" },
  Atlassian: { bg: "#FFF6B6", color: "#222428" },
  Miro:      { bg: "#DEDAFF", color: "#222428" },
  Notion:    { bg: "#F8D3AF", color: "#222428" },
  Brex:      { bg: "#FFD8F4", color: "#222428" },
  Google:    { bg: "#C6DCFF", color: "#222428" },
  Navan:     { bg: "#BADEB1", color: "#222428" },
};

const TAG_BG: Record<string, string> = {
  New: "#BADEB1", Urgent: "#FFD8F4", Customer: "#FFF6B6",
  Market: "#C6DCFF", Strengthening: "#F8D3AF", Weakening: "#f1f2f5",
};

const TYPE_LABEL: Record<string, string> = {
  audio: "Audio", quote: "Quote", theme: "Theme", clips: "Clip",
};

const COL_NUM   = 44;
const COL_TITLE = 180;
const COL_DESC  = 220;
const COL_TYPE  = 72;
const COL_CO    = 110;
const COL_META  = 90;
const ROW_H     = 92;
const HEADER_H  = 44;
const BORDER    = "1px solid #e0e2e8";

// ── Toolbar icon SVGs ──────────────────────────────────────────────────────────
const IcoSync = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8a6 6 0 0110.5-4M14 8a6 6 0 01-10.5 4" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
    <path d="M12.5 2.5v3h-3M3.5 13.5v-3h3" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoLayout = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="2" width="5" height="5" rx="1" stroke="#656b81" strokeWidth="1.5"/>
    <rect x="9" y="2" width="5" height="5" rx="1" stroke="#656b81" strokeWidth="1.5"/>
    <rect x="2" y="9" width="5" height="5" rx="1" stroke="#656b81" strokeWidth="1.5"/>
    <rect x="9" y="9" width="5" height="5" rx="1" stroke="#656b81" strokeWidth="1.5"/>
  </svg>
);
const IcoFilter = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 4h12M4 8h8M6 12h4" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoSort = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M3 4h10M5 8h6M7 12h2" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoGroup = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="3" rx="1.5" stroke="#656b81" strokeWidth="1.5"/>
    <rect x="2" y="10" width="12" height="3" rx="1.5" stroke="#656b81" strokeWidth="1.5"/>
  </svg>
);
const IcoHide = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="#656b81" strokeWidth="1.5"/>
    <path d="M3 3l10 10" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoSettings = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="2" stroke="#656b81" strokeWidth="1.5"/>
    <path d="M8 2v1.5M8 12.5V14M2 8h1.5M12.5 8H14M3.5 3.5l1 1M11.5 11.5l1 1M12.5 3.5l-1 1M4.5 11.5l-1 1" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);
const IcoExpand = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M10 2h4v4M6 14H2v-4M14 6v8h-4M2 10V2h4" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const IcoDots = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="4" cy="8" r="1.5" fill="#656b81"/>
    <circle cx="8" cy="8" r="1.5" fill="#656b81"/>
    <circle cx="12" cy="8" r="1.5" fill="#656b81"/>
  </svg>
);
const IcoBookmark = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M4 2h8a1 1 0 011 1v10l-5-3-5 3V3a1 1 0 011-1z" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
  </svg>
);
const IcoText = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="2" rx="1" fill="#9ca0ad"/>
    <rect x="2" y="7" width="12" height="2" rx="1" fill="#9ca0ad"/>
    <rect x="2" y="11" width="8" height="2" rx="1" fill="#9ca0ad"/>
  </svg>
);
const IcoTag = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M2 2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 010 1.414l-4.586 4.586a1 1 0 01-1.414 0L2.293 8.293A1 1 0 012 7.586V2z" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
    <circle cx="5.5" cy="5.5" r="1" fill="#9ca0ad"/>
  </svg>
);
const IcoCalendar = () => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="2" y="3" width="12" height="11" rx="2" stroke="#9ca0ad" strokeWidth="1.5" fill="none"/>
    <path d="M5 2v2M11 2v2M2 7h12" stroke="#9ca0ad" strokeWidth="1.5" strokeLinecap="round"/>
  </svg>
);

function ToolbarBtn({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: "flex", alignItems: "center", gap: 4,
      padding: "4px 6px", borderRadius: 6, cursor: "default",
    }} title={label}>
      {icon}
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
    return { w: 740, h: 360, table: { heading: "Related", rows: [] } as InsightTableData };
  }

  override getGeometry(shape: IInsightTableShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightTableShape) {
    const { table, w, h } = shape.props;
    const TITLE_H = 36;

    return (
      <HTMLContainer id={shape.id} style={{
        width: w, height: h,
        fontFamily: "sans-serif",
        pointerEvents: "all",
        position: "relative",
        overflow: "visible",
      }}>
        {/* ── Floating header bar (hugs content) ────────────────────── */}
        <div style={{
          position: "absolute", top: 0, left: 0,
          display: "inline-flex", alignItems: "center", gap: 8,
          padding: "0 10px",
          height: TITLE_H,
          backgroundColor: "white",
          border: BORDER,
          borderRadius: 8,
          boxShadow: "0 1px 6px rgba(0,0,0,0.08)",
          whiteSpace: "nowrap",
        }}>
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="3" width="14" height="10" rx="2" stroke="#656b81" strokeWidth="1.5" fill="none"/>
            <path d="M1 7h14M5 3v10" stroke="#656b81" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: "#222428" }}>{table.heading}</span>
          <span style={{ fontSize: 11, fontWeight: 600, color: "#656b81", backgroundColor: "#f1f2f5", borderRadius: 99, padding: "1px 7px" }}>
            {table.rows.length}
          </span>
          <div style={{ color: "#656b81", display: "flex", cursor: "default" }}><IcoExpand /></div>
          <div style={{ display: "flex", alignItems: "center", cursor: "default" }}><IcoDots /></div>
        </div>

        {/* ── Table box (starts below floating header) ──────────────── */}
        <div style={{
          position: "absolute",
          top: TITLE_H + 6,
          left: 0, right: 0,
          height: h - TITLE_H - 6,
          backgroundColor: "white",
          border: BORDER,
          borderRadius: 8,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}>

        {/* ── Toolbar (inside table, above column headers) ──────────── */}
        <div style={{
          display: "flex", alignItems: "center", gap: 2,
          padding: "4px 10px",
          borderBottom: BORDER,
          flexShrink: 0,
        }}>
          <ToolbarBtn icon={<IcoSync />} label="Sync" />
          <ToolbarBtn icon={<IcoLayout />} label="Layout" />
          <ToolbarBtn icon={<IcoFilter />} label="Filter" />
          <ToolbarBtn icon={<IcoSort />} label="Sort" />
          <ToolbarBtn icon={<IcoGroup />} label="Group by" />
          <ToolbarBtn icon={<IcoHide />} label="Hide" />
          <ToolbarBtn icon={<IcoSettings />} label="View settings" />
        </div>

        {/* ── Header row ────────────────────────────────────────────── */}
        <div style={{ display: "flex", borderBottom: BORDER, backgroundColor: "white", flexShrink: 0 }}>
          <div style={{ width: COL_NUM, borderRight: BORDER, flexShrink: 0, height: HEADER_H }} />
          {/* Signal */}
          <div style={{ width: COL_TITLE, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <IcoBookmark /><span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Signal</span>
          </div>
          {/* Description */}
          <div style={{ width: COL_DESC, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <IcoText /><span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Description</span>
          </div>
          {/* Type */}
          <div style={{ width: COL_TYPE, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <IcoTag /><span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Type</span>
          </div>
          {/* Company */}
          <div style={{ width: COL_CO, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H, borderRight: BORDER }}>
            <IcoText /><span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Company</span>
          </div>
          {/* Date */}
          <div style={{ width: COL_META, flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "0 8px", height: HEADER_H }}>
            <IcoCalendar /><span style={{ fontSize: 12, fontWeight: 600, color: "#656b81" }}>Date</span>
          </div>
        </div>

        {/* ── Data rows ─────────────────────────────────────────────── */}
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

                {/* Title + source chip + tag */}
                <div style={{
                  width: COL_TITLE, flexShrink: 0, borderRight: BORDER,
                  padding: "10px 10px",
                  display: "flex", flexDirection: "column", justifyContent: "center", gap: 5,
                }}>
                  <span style={{
                    fontSize: 13, fontWeight: 500, color: "#222428", lineHeight: 1.35,
                    display: "-webkit-box", WebkitBoxOrient: "vertical" as const,
                    WebkitLineClamp: 2, overflow: "hidden",
                  }}>
                    {row.title}
                  </span>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", alignItems: "center" }}>
                    {row.source && (
                      <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, backgroundColor: "#e9eaef", color: "#656b81", fontWeight: 500 }}>
                        {row.source}
                      </span>
                    )}
                    {row.tags && row.tags.slice(0, 1).map(tag => (
                      <span key={tag} style={{ fontSize: 10, padding: "2px 7px", borderRadius: 99, backgroundColor: TAG_BG[tag] ?? "#f1f2f5", color: "#222428" }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                  {row.arr && <span style={{ fontSize: 11, color: "#656b81" }}>{row.arr}</span>}
                </div>

                {/* Description */}
                <div style={{
                  width: COL_DESC, flexShrink: 0, borderRight: BORDER,
                  padding: "10px 10px", display: "flex", alignItems: "center",
                }}>
                  <span style={{
                    fontSize: 12, color: "#656b81", lineHeight: 1.4,
                    display: "-webkit-box", WebkitBoxOrient: "vertical" as const,
                    WebkitLineClamp: 3, overflow: "hidden",
                  }}>
                    {row.description ?? "—"}
                  </span>
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
        </div>{/* end table box */}
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
