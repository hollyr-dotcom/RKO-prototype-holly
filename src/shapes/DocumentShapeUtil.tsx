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
import { IconArrowsOutSimple } from "@mirohq/design-system-icons";
import { AutoSizeWrapper } from "./AutoSizeWrapper";

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
    const isConnected = !!meta?.isConnected;
    const initialContent = meta?.initialContent as string | undefined;
    const pendingContent = meta?.pendingContent as string | undefined;
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
                    shapeType: "document",
                    docId: shape.props.docId,
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
        <AutoSizeWrapper shapeId={shape.id} shapeType={DOCUMENT_SHAPE_TYPE} shapeH={shape.props.h} editor={this.editor} growOnly>
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
        </AutoSizeWrapper>
      </HTMLContainer>
    );
  }

  indicator(shape: IDocumentShape) {
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
