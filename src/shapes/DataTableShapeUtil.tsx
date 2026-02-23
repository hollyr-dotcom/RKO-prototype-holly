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
import { DataTableEditor } from "@/components/DataTableEditor";
import { IconArrowsOutSimple } from "@mirohq/design-system-icons";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

const DATATABLE_SHAPE_TYPE = "datatable" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [DATATABLE_SHAPE_TYPE]: {
      w: number;
      h: number;
      tableId: string;
      title: string;
    };
  }
}

type IDataTableShape = TLShape<typeof DATATABLE_SHAPE_TYPE>;

export class DataTableShapeUtil extends ShapeUtil<IDataTableShape> {
  static override type = DATATABLE_SHAPE_TYPE;
  static override props: RecordProps<IDataTableShape> = {
    w: T.number,
    h: T.number,
    tableId: T.string,
    title: T.string,
  };

  getDefaultProps(): IDataTableShape["props"] {
    return {
      w: 480,
      h: 280,
      tableId: "",
      title: "Untitled table",
    };
  }

  override canEdit() {
    return true;
  }

  override canScroll() {
    return true;
  }

  override canResize() {
    return true;
  }

  override isAspectRatioLocked() {
    return false;
  }

  getGeometry(shape: IDataTableShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: IDataTableShape, info: TLResizeInfo<IDataTableShape>) {
    return resizeBox(shape, info);
  }

  component(shape: IDataTableShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const meta = shape.meta as Record<string, unknown>;
    const isConnected = !!meta?.isConnected;
    const rawInitialData = meta?.initialData;
    const initialData = typeof rawInitialData === "string" ? (() => { try { return JSON.parse(rawInitialData); } catch { return undefined; } })() as { columns: string[]; rows: string[][] } | undefined : rawInitialData as { columns: string[]; rows: string[][] } | undefined;
    const rawPendingRows = meta?.pendingRows;
    const pendingRows = typeof rawPendingRows === "string" ? (() => { try { return JSON.parse(rawPendingRows); } catch { return undefined; } })() as string[][] | undefined : rawPendingRows as string[][] | undefined;

    return (
      <HTMLContainer
        className={isConnected ? "connected-shape-glow" : undefined}
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 16,
          border: `1.5px solid ${isConnected ? "#7C3AED" : "#d0d5dd"}`,
          background: "#ffffff",
          pointerEvents: "all",
        }}
      >
        {!isEditing && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
            }}
          />
        )}
        {isSelected && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("shape:focus", {
                  detail: {
                    shapeType: "datatable",
                    tableId: shape.props.tableId,
                    title: shape.props.title,
                  },
                })
              );
            }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 20,
              width: 28,
              height: 28,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              background: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
            }}
          >
            <IconArrowsOutSimple css={{ width: 14, height: 14, color: "#6b7280" }} />
          </button>
        )}
        <AutoSizeWrapper shapeId={shape.id} shapeType={DATATABLE_SHAPE_TYPE} shapeH={shape.props.h} editor={this.editor}>
          <DataTableEditor
            tableId={shape.props.tableId}
            title={shape.props.title}
            isEditing={isEditing}
            isSelected={isSelected}
            tldrawEditor={this.editor}
            w={shape.props.w}
            h={shape.props.h}
            onEscape={() => this.editor.setEditingShape(null)}
            initialData={initialData}
            pendingRows={pendingRows}
          />
        </AutoSizeWrapper>
      </HTMLContainer>
    );
  }

  indicator(shape: IDataTableShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={16}
        ry={16}
      />
    );
  }
}
