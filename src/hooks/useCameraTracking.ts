import { useCallback, useEffect, useRef, useState } from "react";
import { Editor, Box } from "tldraw";
import type { AICursorTarget, AICursorState } from "@/lib/ai-presence";
import { spring, duration } from "@/lib/motion";

// ─── Constants ──────────────────────────────────────────────────────────────

/** Minimum time (ms) to stay at a camera position before moving to next. */
const MIN_DWELL_MS = 800;

/** Seconds of user inactivity before follow mode resumes after user takeover. */
const RESUME_DELAY_MS = 3_000;

/** Seconds of AI idle before follow mode auto-disables. */
const AUTO_DISABLE_IDLE_MS = 5_000;

/** Minimum padding in pixels around focused content. */
const MIN_PADDING_PX = 80;

/** Viewport fraction padding for a single shape. */
const SINGLE_SHAPE_PADDING = 0.4;

/** Viewport fraction padding for multiple shapes. */
const MULTI_SHAPE_PADDING = 0.15;

/** Viewport fraction padding for a frame. */
const FRAME_PADDING = 0.2;

// Spring values from motion tokens: spring.snappy
const SPRING_STIFFNESS = spring.snappy.stiffness; // 400
const SPRING_DAMPING = spring.snappy.damping; // 30

// Duration tokens in seconds
const DURATION_FAST_S = duration.fast; // 0.2
const DURATION_NORMAL_S = duration.normal; // 0.35
const DURATION_SLOW_S = duration.slow; // 0.5

// ─── Types ──────────────────────────────────────────────────────────────────

export interface UseCameraTrackingOptions {
  editor: Editor | null;
  cursorOnTargetChange:
    | ((cb: (target: AICursorTarget | null) => void) => () => void)
    | null;
  cursorGetState: (() => AICursorState) | null;
}

export interface CameraTracker {
  isEnabled: boolean;
  isPaused: boolean;
  enable(): void;
  disable(): void;
  toggle(): void;
}

// ─── Camera target representation ───────────────────────────────────────────

interface CameraDestination {
  /** Bounds on the page to frame. */
  bounds: { x: number; y: number; w: number; h: number };
  /** Padding fraction to apply. */
  paddingFraction: number;
}

// ─── Helper: compute bounds from AICursorTarget ─────────────────────────────

function resolveTargetBounds(
  editor: Editor,
  target: AICursorTarget
): CameraDestination | null {
  switch (target.type) {
    case "shape": {
      if (!target.shapeId) return null;
      try {
        const b = editor.getShapePageBounds(target.shapeId as any);
        if (!b) return null;
        // Check if the shape is a frame
        const shape = editor.getShape(target.shapeId as any);
        const isFrame = shape?.type === "frame";
        return {
          bounds: { x: b.x, y: b.y, w: b.w, h: b.h },
          paddingFraction: isFrame ? FRAME_PADDING : SINGLE_SHAPE_PADDING,
        };
      } catch {
        return null;
      }
    }

    case "point": {
      if (!target.point) return null;
      // For a point, create a small bounds centered on it
      return {
        bounds: { x: target.point.x - 50, y: target.point.y - 50, w: 100, h: 100 },
        paddingFraction: SINGLE_SHAPE_PADDING,
      };
    }

    case "bounds": {
      if (!target.bounds) return null;
      return {
        bounds: target.bounds,
        paddingFraction: MULTI_SHAPE_PADDING,
      };
    }

    case "shapes": {
      if (!target.shapeIds || target.shapeIds.length === 0) return null;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (const id of target.shapeIds) {
        try {
          const b = editor.getShapePageBounds(id as any);
          if (b) {
            minX = Math.min(minX, b.x);
            minY = Math.min(minY, b.y);
            maxX = Math.max(maxX, b.maxX);
            maxY = Math.max(maxY, b.maxY);
          }
        } catch {
          // skip
        }
      }
      if (minX === Infinity) return null;
      return {
        bounds: { x: minX, y: minY, w: maxX - minX, h: maxY - minY },
        paddingFraction: MULTI_SHAPE_PADDING,
      };
    }

    default:
      return null;
  }
}

// ─── Helper: compute target camera from destination ─────────────────────────

function computeTargetCamera(
  editor: Editor,
  dest: CameraDestination
): { x: number; y: number; z: number } {
  const { bounds, paddingFraction } = dest;
  const viewportScreenBounds = editor.getViewportScreenBounds();
  const vpW = viewportScreenBounds.w;
  const vpH = viewportScreenBounds.h;

  // Apply padding
  const padX = Math.max(MIN_PADDING_PX, vpW * paddingFraction);
  const padY = Math.max(MIN_PADDING_PX, vpH * paddingFraction);

  const availW = vpW - padX * 2;
  const availH = vpH - padY * 2;

  if (availW <= 0 || availH <= 0) {
    // Viewport too small, just center
    const cx = bounds.x + bounds.w / 2;
    const cy = bounds.y + bounds.h / 2;
    const z = editor.getZoomLevel();
    return { x: -(cx - vpW / 2 / z), y: -(cy - vpH / 2 / z), z };
  }

  // Calculate zoom to fit bounds within available area
  const zoomX = availW / Math.max(bounds.w, 1);
  const zoomY = availH / Math.max(bounds.h, 1);
  let z = Math.min(zoomX, zoomY);

  // Clamp to reasonable zoom range
  z = Math.max(0.1, Math.min(z, 2));

  // Center the bounds in the viewport
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;

  return {
    x: -(cx - vpW / 2 / z),
    y: -(cy - vpH / 2 / z),
    z,
  };
}

// ─── Helper: check if bounds are within current viewport ────────────────────

function isBoundsInViewport(
  editor: Editor,
  bounds: { x: number; y: number; w: number; h: number },
  margin: number = 2 // multiplier for "nearby" (2x viewport)
): "inside" | "nearby" | "distant" {
  const vpb = editor.getViewportPageBounds();
  const cx = bounds.x + bounds.w / 2;
  const cy = bounds.y + bounds.h / 2;

  // Check if center is inside current viewport
  if (cx >= vpb.x && cx <= vpb.x + vpb.w && cy >= vpb.y && cy <= vpb.y + vpb.h) {
    return "inside";
  }

  // Check if within margin * viewport size
  const extendedX = vpb.x - vpb.w * (margin - 1) / 2;
  const extendedY = vpb.y - vpb.h * (margin - 1) / 2;
  const extendedW = vpb.w * margin;
  const extendedH = vpb.h * margin;

  if (
    cx >= extendedX &&
    cx <= extendedX + extendedW &&
    cy >= extendedY &&
    cy <= extendedY + extendedH
  ) {
    return "nearby";
  }

  return "distant";
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useCameraTracking(
  options: UseCameraTrackingOptions
): CameraTracker {
  const { editor, cursorOnTargetChange, cursorGetState } = options;

  const [isEnabled, setIsEnabled] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Refs for values accessed in animation frames / timers
  const isEnabledRef = useRef(false);
  const isPausedRef = useRef(false);
  const editorRef = useRef(editor);
  const animFrameRef = useRef<number | null>(null);
  const resumeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoDisableTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastDwellTimeRef = useRef(0);
  const isAnimatingRef = useRef(false);
  const latestTargetRef = useRef<AICursorTarget | null>(null);
  const userCameraRef = useRef<{ x: number; y: number; z: number } | null>(null);
  const programmaticMoveRef = useRef(false);

  // Keep refs in sync
  editorRef.current = editor;

  useEffect(() => {
    isEnabledRef.current = isEnabled;
  }, [isEnabled]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  // ─── Camera animation ──────────────────────────────────────────────

  const stopAnimation = useCallback(() => {
    if (animFrameRef.current !== null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    isAnimatingRef.current = false;
  }, []);

  /**
   * Animate camera to a target position using spring physics.
   * For distant moves, uses a three-phase bird's eye transition.
   */
  const animateCameraTo = useCallback(
    (targetCam: { x: number; y: number; z: number }, durationHint: number) => {
      const ed = editorRef.current;
      if (!ed) return;

      stopAnimation();
      isAnimatingRef.current = true;
      programmaticMoveRef.current = true;

      const cam = ed.getCamera();
      const startX = cam.x;
      const startY = cam.y;
      const startZ = cam.z;

      const dx = targetCam.x - startX;
      const dy = targetCam.y - startY;
      const dz = targetCam.z - startZ;

      // Use spring simulation for smooth motion
      let cx = 0;
      let cy = 0;
      let cz = 0;
      let vx = 0;
      let vy = 0;
      let vz = 0;
      let lastTime = performance.now();

      const step = (now: number) => {
        const dt = Math.min((now - lastTime) / 1000, 0.064);
        lastTime = now;

        // Spring physics: normalized progress 0..1
        const ax = (SPRING_STIFFNESS * (1 - cx) - SPRING_DAMPING * vx);
        const ay = (SPRING_STIFFNESS * (1 - cy) - SPRING_DAMPING * vy);
        const az = (SPRING_STIFFNESS * (1 - cz) - SPRING_DAMPING * vz);

        vx += ax * dt;
        vy += ay * dt;
        vz += az * dt;
        cx += vx * dt;
        cy += vy * dt;
        cz += vz * dt;

        const newX = startX + dx * cx;
        const newY = startY + dy * cy;
        const newZ = startZ + dz * cz;

        programmaticMoveRef.current = true;
        ed.setCamera({ x: newX, y: newY, z: newZ }, { animation: undefined });

        // Check if settled
        const progressDist = Math.abs(1 - cx) + Math.abs(1 - cy) + Math.abs(1 - cz);
        const velMag = Math.abs(vx) + Math.abs(vy) + Math.abs(vz);

        if (progressDist < 0.001 && velMag < 0.01) {
          // Snap to target
          programmaticMoveRef.current = true;
          ed.setCamera(
            { x: targetCam.x, y: targetCam.y, z: targetCam.z },
            { animation: undefined }
          );
          isAnimatingRef.current = false;
          animFrameRef.current = null;

          // Record camera after settling for user-takeover detection
          setTimeout(() => {
            programmaticMoveRef.current = false;
            if (editorRef.current) {
              const c = editorRef.current.getCamera();
              userCameraRef.current = { x: c.x, y: c.y, z: c.z };
            }
          }, 50);
          return;
        }

        animFrameRef.current = requestAnimationFrame(step);
      };

      animFrameRef.current = requestAnimationFrame(step);
    },
    [stopAnimation]
  );

  // ─── Process a target change ───────────────────────────────────────

  const processTarget = useCallback(
    (target: AICursorTarget | null) => {
      const ed = editorRef.current;
      if (!ed || !target) return;
      if (!isEnabledRef.current || isPausedRef.current) return;

      const dest = resolveTargetBounds(ed, target);
      if (!dest) return;

      // Enforce minimum dwell time
      const now = Date.now();
      const elapsed = now - lastDwellTimeRef.current;
      if (elapsed < MIN_DWELL_MS && isAnimatingRef.current) {
        // Queue: just store the latest target, it will be picked up
        latestTargetRef.current = target;
        return;
      }

      lastDwellTimeRef.current = now;
      latestTargetRef.current = null;

      const proximity = isBoundsInViewport(ed, dest.bounds);
      const targetCam = computeTargetCamera(ed, dest);

      if (proximity === "distant") {
        // Bird's eye transition: compute a midpoint camera that shows both
        const cam = ed.getCamera();
        const vpb = ed.getViewportScreenBounds();

        // Midpoint zoom: zoom out enough to see both origin and destination
        const originCenter = {
          x: -(cam.x + vpb.w / 2 / cam.z) * -1,
          y: -(cam.y + vpb.h / 2 / cam.z) * -1,
        };
        // Actually, just use a fixed fraction of the target zoom
        const midZ = Math.min(cam.z, targetCam.z) * 0.5;
        const midCam = {
          x: (cam.x + targetCam.x) / 2,
          y: (cam.y + targetCam.y) / 2,
          z: Math.max(0.1, midZ),
        };

        // Phase 1: zoom out to mid
        animateCameraTo(midCam, DURATION_NORMAL_S * 1000);

        // Phase 2: after roughly DURATION_NORMAL_S, pan+zoom to target
        setTimeout(() => {
          if (!isEnabledRef.current || isPausedRef.current) return;
          animateCameraTo(targetCam, DURATION_NORMAL_S * 1000);
        }, DURATION_NORMAL_S * 1000 + 50);
      } else {
        // Nearby or inside: smooth pan (optionally with zoom adjustment)
        if (proximity === "inside") {
          // Only adjust if target camera differs significantly
          const cam = ed.getCamera();
          const camDist =
            Math.abs(cam.x - targetCam.x) +
            Math.abs(cam.y - targetCam.y) +
            Math.abs(cam.z - targetCam.z);
          if (camDist < 5) return; // Already close enough
        }
        animateCameraTo(targetCam, DURATION_FAST_S * 1000);
      }
    },
    [animateCameraTo]
  );

  // ─── Dwell timer: process queued target after dwell ────────────────

  useEffect(() => {
    if (!isEnabled) return;

    const interval = setInterval(() => {
      const queued = latestTargetRef.current;
      if (queued && !isPausedRef.current) {
        const elapsed = Date.now() - lastDwellTimeRef.current;
        if (elapsed >= MIN_DWELL_MS) {
          processTarget(queued);
        }
      }
    }, 200);

    return () => clearInterval(interval);
  }, [isEnabled, processTarget]);

  // ─── User takeover detection ───────────────────────────────────────

  useEffect(() => {
    if (!editor || !isEnabled) return;

    // Snapshot camera after enabling
    const cam = editor.getCamera();
    userCameraRef.current = { x: cam.x, y: cam.y, z: cam.z };

    const unsub = editor.store.listen(
      () => {
        // If we're the ones moving the camera, ignore
        if (programmaticMoveRef.current) return;
        if (!isEnabledRef.current) return;

        // User moved the camera
        if (!isPausedRef.current) {
          setIsPaused(true);
          isPausedRef.current = true;
          stopAnimation();
        }

        // Clear and restart resume timer
        if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = setTimeout(() => {
          if (isEnabledRef.current) {
            setIsPaused(false);
            isPausedRef.current = false;

            // Re-process the latest target if there is one
            if (latestTargetRef.current) {
              processTarget(latestTargetRef.current);
            }
          }
        }, RESUME_DELAY_MS);
      },
      { source: "user", scope: "session" }
    );

    return () => {
      unsub();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
    };
  }, [editor, isEnabled, stopAnimation, processTarget]);

  // ─── Subscribe to cursor target changes ────────────────────────────

  useEffect(() => {
    if (!cursorOnTargetChange || !isEnabled) return;

    const unsub = cursorOnTargetChange((target) => {
      if (!isEnabledRef.current) return;
      processTarget(target);
    });

    return unsub;
  }, [cursorOnTargetChange, isEnabled, processTarget]);

  // ─── Auto-enable/disable based on AI state ─────────────────────────

  useEffect(() => {
    if (!cursorGetState) return;

    const checkState = () => {
      const aiState = cursorGetState();

      if (aiState === "working" || aiState === "pointing") {
        // Auto-enable
        if (!isEnabledRef.current) {
          setIsEnabled(true);
          isEnabledRef.current = true;
          setIsPaused(false);
          isPausedRef.current = false;
        }

        // Clear auto-disable timer
        if (autoDisableTimerRef.current) {
          clearTimeout(autoDisableTimerRef.current);
          autoDisableTimerRef.current = null;
        }
      } else if (aiState === "idle") {
        // Start auto-disable countdown
        if (isEnabledRef.current && !autoDisableTimerRef.current) {
          autoDisableTimerRef.current = setTimeout(() => {
            setIsEnabled(false);
            isEnabledRef.current = false;
            setIsPaused(false);
            isPausedRef.current = false;
            stopAnimation();
            autoDisableTimerRef.current = null;
          }, AUTO_DISABLE_IDLE_MS);
        }
      }
    };

    // Poll AI state periodically (the cursor hook doesn't provide a subscription for state)
    const interval = setInterval(checkState, 500);
    checkState();

    return () => {
      clearInterval(interval);
      if (autoDisableTimerRef.current) {
        clearTimeout(autoDisableTimerRef.current);
        autoDisableTimerRef.current = null;
      }
    };
  }, [cursorGetState, stopAnimation]);

  // ─── Cleanup on unmount ────────────────────────────────────────────

  useEffect(() => {
    return () => {
      stopAnimation();
      if (resumeTimerRef.current) clearTimeout(resumeTimerRef.current);
      if (autoDisableTimerRef.current) clearTimeout(autoDisableTimerRef.current);
    };
  }, [stopAnimation]);

  // ─── Public API ────────────────────────────────────────────────────

  const enable = useCallback(() => {
    setIsEnabled(true);
    isEnabledRef.current = true;
    setIsPaused(false);
    isPausedRef.current = false;
  }, []);

  const disable = useCallback(() => {
    setIsEnabled(false);
    isEnabledRef.current = false;
    setIsPaused(false);
    isPausedRef.current = false;
    stopAnimation();
  }, [stopAnimation]);

  const toggle = useCallback(() => {
    if (isEnabledRef.current) {
      disable();
    } else {
      enable();
    }
  }, [enable, disable]);

  return {
    isEnabled,
    isPaused,
    enable,
    disable,
    toggle,
  };
}
