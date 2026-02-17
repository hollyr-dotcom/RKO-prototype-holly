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
import { useRef, useEffect, useCallback, useState } from "react";
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
const HOLD_DURATION_MS = 2000;

// Lottie animation frame markers (ip=120, op=360 at 60fps)
// First half = charge-up (2s), second half = celebration (2s)
const FRAME_START = 120;
const FRAME_MID = 240;
const FRAME_END = 360;

function ApproveButtonComponent({ shape }: { shape: IApproveButtonShape }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const animRef = useRef<AnimationItem | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const hasTriggeredRef = useRef(false);
  const [isTriggered, setIsTriggered] = useState(false);
  const [isHolding, setIsHolding] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);

  // Initialize Lottie animation
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

    return () => {
      anim.destroy();
      animRef.current = null;
    };
  }, []);

  const clearHold = useCallback(() => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
    setIsHolding(false);
    setHoldProgress(0);

    // Reset animation if hold wasn't completed
    if (!hasTriggeredRef.current && animRef.current) {
      animRef.current.goToAndStop(0, true);
    }
  }, []);

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      hasTriggeredRef.current = false;
      setIsHolding(true);
      setHoldProgress(0);

      // Play charge-up phase (first half of animation, 2s at 60fps speed 1)
      if (animRef.current) {
        animRef.current.playSegments([0, FRAME_MID - FRAME_START], true);
        animRef.current.setSpeed(1);
      }

      // Update progress ring every 50ms
      const startTime = Date.now();
      progressIntervalRef.current = setInterval(() => {
        const elapsed = Date.now() - startTime;
        setHoldProgress(Math.min(elapsed / HOLD_DURATION_MS, 1));
      }, 50);

      // Trigger after 2 seconds
      holdTimerRef.current = setTimeout(() => {
        hasTriggeredRef.current = true;
        setHoldProgress(1);

        if (progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current);
          progressIntervalRef.current = null;
        }

        // Play celebration phase (second half), then hold last frame
        if (animRef.current) {
          const totalFrames = FRAME_END - FRAME_START;
          const midFrame = FRAME_MID - FRAME_START;
          animRef.current.playSegments([midFrame, totalFrames], true);
          animRef.current.addEventListener("complete", () => {
            animRef.current?.goToAndStop(totalFrames - 1, true);
          });
        }

        setIsTriggered(true);

        // Dispatch event for Canvas.tsx to send the AI prompt
        window.dispatchEvent(
          new CustomEvent("shape:approve-trigger", {
            detail: {
              shapeId: shape.id,
              prompt: "Say happy birthday",
            },
          })
        );

        setIsHolding(false);
      }, HOLD_DURATION_MS);
    },
    [shape.id]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      clearHold();
    },
    [clearHold]
  );

  const handlePointerLeave = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      clearHold();
    },
    [clearHold]
  );

  const circumference = 2 * Math.PI * 28;

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
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />

      {/* Circular progress ring during hold */}
      {isHolding && (
        <svg
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: 64,
            height: 64,
            pointerEvents: "none",
          }}
          viewBox="0 0 64 64"
        >
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="3"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            fill="none"
            stroke="white"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - holdProgress)}
            style={{
              transform: "rotate(-90deg)",
              transformOrigin: "center",
            }}
          />
        </svg>
      )}
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

  indicator(_shape: IApproveButtonShape) {
    return null;
  }
}
