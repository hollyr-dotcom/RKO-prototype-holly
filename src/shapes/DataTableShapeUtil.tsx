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
    const initialData = meta?.initialData as { columns: string[]; rows: string[][] } | undefined;

    return (
      <HTMLContainer
        style={{
          width: shape.props.w,
          height: shape.props.h,
          overflow: "hidden",
          borderRadius: 8,
          border: "1px solid #d0d5dd",
          background: "#ffffff",
          display: "flex",
          flexDirection: "column",
        }}
      >
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
        />
      </HTMLContainer>
    );
  }

  indicator(shape: IDataTableShape) {
    return (
      <rect
        width={shape.props.w}
        height={shape.props.h}
        rx={8}
        ry={8}
      />
    );
  }
}
