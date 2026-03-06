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

const TAG_BG: Record<string, string> = {
  New: "#BADEB1", Urgent: "#FFD8F4", Customer: "#FFF6B6",
  Market: "#C6DCFF", Strengthening: "#F8D3AF", Weakening: "#f1f2f5",
};

const TYPE_LABEL: Record<string, string> = {
  audio: "Audio", quote: "Quote", theme: "Theme", clips: "Clip",
};

export class InsightTableShapeUtil extends ShapeUtil<IInsightTableShape> {
  static override type = INSIGHT_TABLE_SHAPE_TYPE;

  static override props: RecordProps<IInsightTableShape> = {
    w: T.number,
    h: T.number,
    table: T.any,
  };

  override getDefaultProps() {
    return { w: 480, h: 280, table: { heading: "Related", rows: [] } as InsightTableData };
  }

  override getGeometry(shape: IInsightTableShape): Geometry2d {
    return new Rectangle2d({ width: shape.props.w, height: shape.props.h, isFilled: true });
  }

  override component(shape: IInsightTableShape) {
    const { table, w, h } = shape.props;

    return (
      <HTMLContainer id={shape.id} style={{
        width: w, height: h,
        borderRadius: 16,
        border: "1px solid #e0e2e8",
        backgroundColor: "white",
        fontFamily: "sans-serif",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        pointerEvents: "all",
      }}>
        {/* Heading */}
        <div style={{
          padding: "14px 18px 10px",
          fontSize: 13,
          fontWeight: 600,
          color: "#222428",
          borderBottom: "1px solid #f1f2f5",
          flexShrink: 0,
        }}>
          {table.heading}
        </div>

        {/* Column headers */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 64px 96px 60px",
          padding: "6px 18px",
          borderBottom: "1px solid #f1f2f5",
          flexShrink: 0,
        }}>
          {["Signal", "Type", "Company", "Date"].map(col => (
            <span key={col} style={{ fontSize: 10, fontWeight: 600, color: "#9ca0ad", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              {col}
            </span>
          ))}
        </div>

        {/* Rows */}
        <div style={{ flex: 1, overflowY: "auto" }}>
          {table.rows.map((row, i) => (
            <div key={i} style={{
              display: "grid",
              gridTemplateColumns: "1fr 64px 96px 60px",
              padding: "9px 18px",
              borderBottom: i < table.rows.length - 1 ? "1px solid #f1f2f5" : "none",
              alignItems: "center",
            }}>
              {/* Title + tags */}
              <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
                <span style={{ fontSize: 12, fontWeight: 500, color: "#222428", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {row.title}
                </span>
                {row.tags && row.tags.length > 0 && (
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {row.tags.slice(0, 2).map(tag => (
                      <span key={tag} style={{
                        fontSize: 9, padding: "1px 6px", borderRadius: 99,
                        backgroundColor: TAG_BG[tag] ?? "#f1f2f5", color: "#222428",
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              {/* Type */}
              <span style={{ fontSize: 11, color: "#656b81" }}>
                {row.type ? (TYPE_LABEL[row.type] ?? row.type) : "—"}
              </span>
              {/* Company */}
              <span style={{ fontSize: 11, color: "#656b81", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {row.company ?? "—"}
              </span>
              {/* Date */}
              <span style={{ fontSize: 11, color: "#9ca0ad" }}>
                {row.date ?? "—"}
              </span>
            </div>
          ))}
        </div>
      </HTMLContainer>
    );
  }

  override indicator(shape: IInsightTableShape) {
    return <rect width={shape.props.w} height={shape.props.h} rx={16} />;
  }

  override onResize(shape: IInsightTableShape, info: TLResizeInfo<IInsightTableShape>) {
    return resizeBox(shape, info);
  }
}
