"use client";

import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLShape,
} from "tldraw";
import { IconChat } from "@mirohq/design-system-icons";

const COMMENT_SHAPE_TYPE = "comment" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [COMMENT_SHAPE_TYPE]: {
      threadId: string;
    };
  }
}

type ICommentShape = TLShape<typeof COMMENT_SHAPE_TYPE>;

const COMMENT_PIN_SIZE = 28;

export class CommentShapeUtil extends ShapeUtil<ICommentShape> {
  static override type = COMMENT_SHAPE_TYPE;
  static override props: RecordProps<ICommentShape> = {
    threadId: T.string,
  };

  getDefaultProps(): ICommentShape["props"] {
    return {
      threadId: "",
    };
  }

  override canEdit() {
    return false;
  }

  override canResize() {
    return false;
  }

  override canBind() {
    return false;
  }

  override isAspectRatioLocked() {
    return true;
  }

  override hideRotateHandle() {
    return true;
  }

  override hideSelectionBoundsBg() {
    return true;
  }

  override hideSelectionBoundsFg() {
    return true;
  }

  getGeometry(_shape: ICommentShape): Geometry2d {
    return new Rectangle2d({
      width: COMMENT_PIN_SIZE,
      height: COMMENT_PIN_SIZE,
      isFilled: true,
    });
  }

  component(_shape: ICommentShape) {
    return (
      <HTMLContainer
        style={{
          width: COMMENT_PIN_SIZE,
          height: COMMENT_PIN_SIZE,
          pointerEvents: "all",
        }}
      >
        <div
          style={{
            width: COMMENT_PIN_SIZE,
            height: COMMENT_PIN_SIZE,
            borderRadius: "50%",
            background: "#3b82f6",
            border: "2px solid white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
            cursor: "pointer",
          }}
        >
          <IconChat css={{ width: 14, height: 14, color: 'white' }} />
        </div>
      </HTMLContainer>
    );
  }

  indicator(_shape: ICommentShape) {
    return (
      <circle
        cx={COMMENT_PIN_SIZE / 2}
        cy={COMMENT_PIN_SIZE / 2}
        r={COMMENT_PIN_SIZE / 2}
      />
    );
  }
}
