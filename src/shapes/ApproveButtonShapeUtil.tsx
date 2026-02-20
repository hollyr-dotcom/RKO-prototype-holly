"use client";

import {
  Geometry2d,
  HTMLContainer,
  RecordProps,
  Rectangle2d,
  ShapeUtil,
  T,
  TLShape,
  useEditor,
} from "tldraw";
import { useRef, useEffect } from "react";
import lottie, { AnimationItem } from "lottie-web";
import approveButtonData from "@/data/approve-button-lottie.json";

export const APPROVE_BUTTON_SHAPE_TYPE = "approvebutton" as const;

declare module "tldraw" {
  export interface TLGlobalShapePropsMap {
    [APPROVE_BUTTON_SHAPE_TYPE]: {
      w: number;
      h: number;
    };
  }
}

type IApproveButtonShape = TLShape<typeof APPROVE_BUTTON_SHAPE_TYPE>;

const DEFAULT_W = 450;
const DEFAULT_H = 278;

// Lottie animation frame markers (ip=120, op=360 at 60fps)
const FRAME_START = 120;
const FRAME_END = 280;
const TRIGGER_FRAME = 110;

function ApproveButtonComponent({ shape }: { shape: IApproveButtonShape }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const hasTriggeredRef = useRef(false);
  const isHoldingRef = useRef(false);
  const committedRef = useRef(false);
  const startPointRef = useRef<{ x: number; y: number } | null>(null);
  const editor = useEditor();

  // Initialize Lottie animation and listen for complete
  useEffect(() => {
    if (!containerRef.current) return;

    const anim = lottie.loadAnimation({
      container: containerRef.current,
      renderer: "svg",
      loop: false,
      autoplay: false,
      animationData: approveButtonData,
    });

    animRef.current = anim;
    anim.goToAndStop(1, true);

    const onComplete = () => {
      console.log("[ApproveButton] onComplete", { isHolding: isHoldingRef.current, committed: committedRef.current, hasTriggered: hasTriggeredRef.current });
      if (hasTriggeredRef.current) return;
      if (!isHoldingRef.current && !committedRef.current) return;
      hasTriggeredRef.current = true;
      console.log("[ApproveButton] TRIGGERED — dispatching shape:approve-trigger");

      anim.goToAndStop(FRAME_END - 1, true);

      window.dispatchEvent(
        new CustomEvent("shape:approve-trigger", {
          detail: {
            shapeId: shape.id,
            prompt: "Create a plan to distribute the decision that was just approved. Step 1: Produce a summary of the decision and a talk track. Step 2: Notify the relevant teams.",
          },
        })
      );
    };

    anim.addEventListener("enterFrame", () => {
      console.log("[ApproveButton] frame:", anim.currentFrame);
      if (anim.currentFrame >= TRIGGER_FRAME && !committedRef.current) {
        committedRef.current = true;
        console.log("[ApproveButton] passed trigger frame — committed");
      }
    });
    anim.addEventListener("complete", onComplete);

    return () => {
      anim.removeEventListener("complete", onComplete);
      anim.destroy();
      animRef.current = null;
    };
  }, [shape.id]);

  // Listen on the editor container — bypasses the overlay and tldraw's
  // event interception. Hit-test to check if the click is on this shape.
  useEffect(() => {
    const editorContainer = editor.getContainer();

    const onDown = () => {
      if (hasTriggeredRef.current) return;
      const point = editor.inputs.currentPagePoint;
      const hitShape = editor.getShapeAtPoint(point);
      console.log("[ApproveButton] editorContainer pointerdown", {
        point,
        hitShapeId: hitShape?.id,
        myShapeId: shape.id,
        match: hitShape?.id === shape.id,
      });
      if (hitShape?.id !== shape.id) return;

      isHoldingRef.current = true;
      startPointRef.current = { x: point.x, y: point.y };
      console.log("[ApproveButton] started hold — playing animation");
      if (animRef.current) {
        animRef.current.playSegments([FRAME_START, FRAME_END], true);
      }
    };

    const DRAG_THRESHOLD = 5;

    const onMove = () => {
      if (!isHoldingRef.current || committedRef.current || !startPointRef.current) return;
      const point = editor.inputs.currentPagePoint;
      const dx = point.x - startPointRef.current.x;
      const dy = point.y - startPointRef.current.y;
      if (dx * dx + dy * dy > DRAG_THRESHOLD * DRAG_THRESHOLD) {
        console.log("[ApproveButton] drag detected — cancelling animation");
        isHoldingRef.current = false;
        startPointRef.current = null;
        if (animRef.current) {
          animRef.current.stop();
          animRef.current.goToAndStop(1, true);
        }
      }
    };

    const onUp = () => {
      startPointRef.current = null;
      if (!isHoldingRef.current) return;
      isHoldingRef.current = false;
      const currentFrame = animRef.current?.currentFrame ?? 0;
      const isCommitted = committedRef.current || currentFrame >= TRIGGER_FRAME;
      console.log("[ApproveButton] pointerup", { currentFrame, isCommitted, hasTriggered: hasTriggeredRef.current });
      if (isCommitted) {
        committedRef.current = true;
      } else if (!hasTriggeredRef.current && animRef.current) {
        console.log("[ApproveButton] released early — resetting animation");
        animRef.current.stop();
        animRef.current.goToAndStop(1, true);
      }
    };

    editorContainer.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);

    return () => {
      editorContainer.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [editor, shape.id]);

  return (
    <HTMLContainer
      style={{
        width: shape.props.w,
        height: shape.props.h,
        pointerEvents: "all",
        position: "relative",
        cursor: "pointer",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Lottie animation container */}
      <div
        ref={containerRef}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </HTMLContainer>
  );
}

export class ApproveButtonShapeUtil extends ShapeUtil<IApproveButtonShape> {
  static override type = APPROVE_BUTTON_SHAPE_TYPE;
  static override props: RecordProps<IApproveButtonShape> = {
    w: T.number,
    h: T.number,
  };

  getDefaultProps(): IApproveButtonShape["props"] {
    return {
      w: DEFAULT_W,
      h: DEFAULT_H,
    };
  }

  override canEdit() {
    return true;
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

  getGeometry(shape: IApproveButtonShape): Geometry2d {
    return new Rectangle2d({
      width: shape.props.w,
      height: shape.props.h,
      isFilled: true,
    });
  }

  component(shape: IApproveButtonShape) {
    return <ApproveButtonComponent shape={shape} />;
  }

  indicator() {
    return null;
  }
}
