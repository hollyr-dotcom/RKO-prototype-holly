/**
 * AI Cursor Presence — state machine types and transitions.
 *
 * States:
 *   idle      – cursor hidden, AI not engaged
 *   listening – AI processing/thinking, cursor visible with pulse
 *   working   – AI executing tools, cursor moves with status label
 *   pointing  – AI referencing a target, cursor stationary at shape
 *   asking    – AI asking a question, cursor shows chat bubble
 *   waiting   – AI paused for feedback, "Waiting for you..." label
 */

export type AICursorState =
  | "idle"
  | "listening"
  | "working"
  | "pointing"
  | "asking"
  | "waiting";

export interface AICursorTarget {
  type: "shape" | "point" | "bounds" | "shapes";
  shapeId?: string;
  shapeIds?: string[];
  point?: { x: number; y: number };
  bounds?: { x: number; y: number; w: number; h: number };
  label?: string;
}

/**
 * Valid state transitions.
 * Each key maps to the set of states it can transition into.
 */
export const AI_PRESENCE_TRANSITIONS: Record<AICursorState, AICursorState[]> = {
  idle: ["listening"],
  listening: ["working", "pointing", "asking", "idle"],
  working: ["pointing", "waiting", "idle"],
  pointing: ["idle", "working", "pointing"], // can re-point to new target
  asking: ["idle", "listening"],
  waiting: ["working", "idle"],
};

/**
 * Check whether a transition from `from` to `to` is valid.
 */
export function isValidTransition(from: AICursorState, to: AICursorState): boolean {
  return AI_PRESENCE_TRANSITIONS[from].includes(to);
}

/** Auto-idle timeout in ms — transition to idle after this much inactivity. */
export const AUTO_IDLE_TIMEOUT_MS = 10_000;

/** Minimum dwell time at a target before moving to the next (ms). */
export const MIN_DWELL_MS = 1_000;

/** The AI cursor color — used to identify AI cursor in the CustomCursor component. */
export const AI_CURSOR_COLOR = "#2563EB";

/**
 * Lightweight shared state so the CustomCursor component can read
 * the current AI presence state without prop-drilling or context.
 * Updated by useAICursor; read by the cursor renderer.
 */
let _currentAIState: AICursorState = "idle";

export function setSharedAIState(s: AICursorState) {
  _currentAIState = s;
}

export function getSharedAIState(): AICursorState {
  return _currentAIState;
}
