/**
 * Focus-mode store — single source of truth for which document is expanded.
 *
 * Uses a React portal approach: the on-canvas TipTap editor is never unmounted.
 * When focus mode activates, the editor's DOM output is portaled into the
 * overlay container. When focus mode closes, the portal is removed and the
 * editor renders back inside the shape. One editor, one Liveblocks connection,
 * zero sync issues.
 */

import { useSyncExternalStore } from "react";

let focusedDocId: string | null = null;
let portalTarget: HTMLDivElement | null = null;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((l) => l());
}

// --- Focused doc ID ---

export function setFocusedDocId(id: string | null) {
  focusedDocId = id;
  notify();
}

export function useFocusedDocId() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => focusedDocId,
    () => null
  );
}

// --- Portal target (the DOM node in the overlay where the editor renders) ---

export function setPortalTarget(el: HTMLDivElement | null) {
  portalTarget = el;
  notify();
}

export function usePortalTarget() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => portalTarget,
    () => null
  );
}
