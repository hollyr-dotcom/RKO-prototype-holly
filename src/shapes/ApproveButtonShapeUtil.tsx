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
import { useRef, useEffect, useCallback } from "react";
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
const FRAME_END = 360;

function ApproveButtonComponent({ shape }: { shape: IApproveButtonShape }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const hasTriggeredRef = useRef(false);
  const isHoldingRef = useRef(false);

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
    anim.goToAndStop(0, true);

    const onComplete = () => {
      if (!isHoldingRef.current || hasTriggeredRef.current) return;
      hasTriggeredRef.current = true;

      // Hold on last frame
      const totalFrames = FRAME_END - FRAME_START;
      anim.goToAndStop(totalFrames - 1, true);

      // Dispatch event for Canvas.tsx to send the AI prompt
      window.dispatchEvent(
        new CustomEvent("shape:approve-trigger", {
          detail: {
            shapeId: shape.id,
            prompt: "Create a plan to distribute the decision that was just approved. Step 1: Produce a summary of the decision and a talk track. Step 2: Notify the relevant teams.",
          },
        })
      );
    };

    anim.addEventListener("complete", onComplete);

    return () => {
      anim.removeEventListener("complete", onComplete);
      anim.destroy();
      animRef.current = null;
    };
  }, [shape.id]);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (hasTriggeredRef.current) return;
      isHoldingRef.current = true;

      // Play the full animation from the start
      if (animRef.current) {
        const totalFrames = FRAME_END - FRAME_START;
        animRef.current.playSegments([0, totalFrames], true);
      }
    },
    []
  );

  const handleRelease = useCallback(
    (e: React.PointerEvent) => {
      isHoldingRef.current = false;

      // If not yet triggered, stop and reset the animation
      if (!hasTriggeredRef.current && animRef.current) {
        animRef.current.stop();
        animRef.current.goToAndStop(0, true);
      }
    },
    []
  );

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
        onPointerDown={handlePointerDown}
        onPointerUp={handleRelease}
        onPointerLeave={handleRelease}
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

  indicator(shape: IApproveButtonShape) {
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
