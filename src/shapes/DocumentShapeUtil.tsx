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
import { DocumentEditor } from "@/components/DocumentEditor";

const DOCUMENT_SHAPE_TYPE = "document" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [DOCUMENT_SHAPE_TYPE]: {
      w: number;
      h: number;
      docId: string;
      title: string;
    };
  }
}

type IDocumentShape = TLShape<typeof DOCUMENT_SHAPE_TYPE>;

export class DocumentShapeUtil extends ShapeUtil<IDocumentShape> {
  static override type = DOCUMENT_SHAPE_TYPE;
  static override props: RecordProps<IDocumentShape> = {
    w: T.number,
    h: T.number,
    docId: T.string,
    title: T.string,
  };

  getDefaultProps(): IDocumentShape["props"] {
    return {
      w: 780,
      h: 660,
      docId: "",
      title: "Untitled document",
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

  getGeometry(shape: IDocumentShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  override onResize(shape: IDocumentShape, info: TLResizeInfo<IDocumentShape>) {
    return resizeBox(shape, info);
  }

  component(shape: IDocumentShape) {
    const isEditing = this.editor.getEditingShapeId() === shape.id;
    const isSelected = this.editor.getSelectedShapeIds().includes(shape.id);
    const meta = shape.meta as Record<string, unknown>;
    const initialContent = meta?.initialContent as string | undefined;
    const pendingContent = meta?.pendingContent as string | undefined;

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
        <DocumentEditor
          docId={shape.props.docId}
          title={shape.props.title}
          isEditing={isEditing}
          isSelected={isSelected}
          tldrawEditor={this.editor}
          shapeId={shape.id}
          initialContent={initialContent}
          pendingContent={pendingContent}
          w={shape.props.w}
          h={shape.props.h}
          onEscape={() => this.editor.setEditingShape(null)}
        />
      </HTMLContainer>
    );
  }

  indicator(shape: IDocumentShape) {
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
