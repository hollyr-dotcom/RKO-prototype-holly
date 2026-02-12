"use client";

import { Editor, createShapeId } from "tldraw";
import { useState, useEffect, useCallback, useRef } from "react";
import {
  useThreads,
  useCreateThread,
  useEditThreadMetadata,
  useDeleteThread,
  useMarkThreadAsResolved,
} from "@/liveblocks.config";
import { Thread, Composer } from "@liveblocks/react-ui";
import { IconChat } from "@mirohq/design-system-icons";

interface CanvasCommentsProps {
  editor: Editor | null;
  isCommentMode: boolean;
  onExitCommentMode: () => void;
}

export function CanvasComments({ editor, isCommentMode, onExitCommentMode }: CanvasCommentsProps) {
  const { threads } = useThreads();
  const createThread = useCreateThread();
  const editThreadMetadata = useEditThreadMetadata();
  const deleteThread = useDeleteThread();
  const markThreadAsResolved = useMarkThreadAsResolved();

  // Track camera to re-render popover positions on pan/zoom
  const [cameraVersion, setCameraVersion] = useState(0);

  // Track where a new composer should appear (screen coordinates)
  const [newCommentPos, setNewCommentPos] = useState<{
    screenX: number;
    screenY: number;
    pageX: number;
    pageY: number;
  } | null>(null);

  // Track which thread is currently open (by threadId)
  const [openThreadId, setOpenThreadId] = useState<string | null>(null);

  // Ref to track thread IDs that already have shapes, to avoid duplicate creation
  const syncedThreadIdsRef = useRef<Set<string>>(new Set());

  // Flag to suppress the delete listener during programmatic cleanup
  const isSyncingRef = useRef(false);

  // Subscribe to camera changes to keep popover positions in sync
  useEffect(() => {
    if (!editor) return;
    const unsub = editor.store.listen(
      () => setCameraVersion((v) => v + 1),
      { source: "all", scope: "document" }
    );
    return unsub;
  }, [editor]);

  // --- Initial sync: reconcile threads <-> comment shapes ---
  useEffect(() => {
    if (!editor || !threads) return;

    const allShapes = editor.getCurrentPageShapes();
    const commentShapes = allShapes.filter((s) => s.type === "comment");
    const unresolvedThreads = threads.filter((t) => !t.resolved);

    // Create shapes for threads that don't have one yet
    for (const thread of unresolvedThreads) {
      const metadata = thread.metadata as any;
      if (metadata?.x == null || metadata?.y == null) continue;

      const hasShape = commentShapes.some(
        (s) => (s.props as any).threadId === thread.id
      );
      if (!hasShape && !syncedThreadIdsRef.current.has(thread.id)) {
        syncedThreadIdsRef.current.add(thread.id);
        editor.createShape({
          id: createShapeId(),
          type: "comment",
          x: metadata.x,
          y: metadata.y,
          props: { threadId: thread.id },
        });
      }
    }

    // Remove orphaned comment shapes (thread was resolved or deleted externally)
    const activeThreadIds = new Set(unresolvedThreads.map((t) => t.id));
    isSyncingRef.current = true;
    for (const shape of commentShapes) {
      const threadId = (shape.props as any).threadId;
      if (threadId && !activeThreadIds.has(threadId)) {
        editor.deleteShape(shape.id);
        syncedThreadIdsRef.current.delete(threadId);
      }
    }
    isSyncingRef.current = false;
  }, [editor, threads]);

  // --- Sync shape moves -> update thread metadata ---
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.store.listen(
      ({ changes }) => {
        for (const [from, to] of Object.values(changes.updated)) {
          if (
            (to as any).typeName === "shape" &&
            (to as any).type === "comment"
          ) {
            const shape = to as any;
            const prevShape = from as any;
            // Only sync if position actually changed
            if (shape.x !== prevShape.x || shape.y !== prevShape.y) {
              const threadId = shape.props?.threadId;
              if (threadId) {
                editThreadMetadata({
                  threadId,
                  metadata: { x: shape.x, y: shape.y },
                });
              }
            }
          }
        }
      },
      { source: "user", scope: "document" }
    );

    return unsub;
  }, [editor, editThreadMetadata]);

  // --- Sync shape deletes -> delete the Liveblocks thread ---
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.store.listen(
      ({ changes }) => {
        // Skip if we're doing programmatic cleanup
        if (isSyncingRef.current) return;

        for (const record of Object.values(changes.removed)) {
          if (
            (record as any).typeName === "shape" &&
            (record as any).type === "comment"
          ) {
            const threadId = (record as any).props?.threadId;
            if (threadId) {
              syncedThreadIdsRef.current.delete(threadId);
              // Close the popover if this thread was open
              setOpenThreadId((prev) => (prev === threadId ? null : prev));
              try {
                deleteThread(threadId);
              } catch {
                // deleteThread fails if the thread has replies or wasn't
                // created by the current user. Fall back to resolving the
                // thread so it won't reappear on refresh (the sync logic
                // already filters out resolved threads).
                try {
                  markThreadAsResolved(threadId);
                } catch (e2) {
                  console.warn("Failed to delete or resolve thread:", e2);
                }
              }
            }
          }
        }
      },
      { source: "user", scope: "document" }
    );

    return unsub;
  }, [editor, deleteThread, markThreadAsResolved]);

  // --- Open thread popover when a comment shape is selected ---
  useEffect(() => {
    if (!editor) return;

    const unsub = editor.store.listen(
      () => {
        const selectedShapes = editor.getSelectedShapes();
        if (
          selectedShapes.length === 1 &&
          selectedShapes[0].type === "comment"
        ) {
          const threadId = (selectedShapes[0].props as any).threadId;
          if (threadId) {
            setOpenThreadId(threadId);
            return;
          }
        }
        // If nothing is selected or a non-comment shape is selected, close the popover
        if (
          selectedShapes.length === 0 ||
          selectedShapes[0]?.type !== "comment"
        ) {
          setOpenThreadId(null);
        }
      },
      { source: "user", scope: "session" }
    );

    return unsub;
  }, [editor]);

  // Handle click on the overlay to place a new comment
  const handleOverlayClick = useCallback(
    (e: React.MouseEvent) => {
      if (!isCommentMode || !editor) return;

      const target = e.target as HTMLElement;
      if (
        target.closest("[data-comment-thread]") ||
        target.closest("[data-comment-composer]")
      ) {
        return;
      }

      const pagePoint = editor.screenToPage({ x: e.clientX, y: e.clientY });

      setNewCommentPos({
        screenX: e.clientX,
        screenY: e.clientY,
        pageX: pagePoint.x,
        pageY: pagePoint.y,
      });
    },
    [isCommentMode, editor]
  );

  // Handle new thread creation from the composer
  const handleComposerSubmit = useCallback(
    ({ body }: any, e: React.FormEvent) => {
      e.preventDefault();
      if (!newCommentPos || !editor) return;

      const thread = createThread({
        body,
        metadata: {
          x: newCommentPos.pageX,
          y: newCommentPos.pageY,
          zIndex: 0,
        },
      });

      // Create the comment shape on the canvas
      syncedThreadIdsRef.current.add(thread.id);
      editor.createShape({
        id: createShapeId(),
        type: "comment",
        x: newCommentPos.pageX,
        y: newCommentPos.pageY,
        props: { threadId: thread.id },
      });

      setNewCommentPos(null);
      onExitCommentMode();
      setOpenThreadId(thread.id);
    },
    [createThread, newCommentPos, editor, onExitCommentMode]
  );

  // Close composer/popover on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (newCommentPos) setNewCommentPos(null);
        if (openThreadId) setOpenThreadId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [newCommentPos, openThreadId]);

  // Get screen position for a comment shape by its threadId
  const getShapeScreenPos = useCallback(
    (threadId: string) => {
      if (!editor) return null;
      const shapes = editor.getCurrentPageShapes();
      const commentShape = shapes.find(
        (s) => s.type === "comment" && (s.props as any).threadId === threadId
      );
      if (!commentShape) return null;
      return editor.pageToScreen({ x: commentShape.x, y: commentShape.y });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [editor, cameraVersion]
  );

  if (!editor) return null;

  return (
    <div
      className="absolute inset-0 z-[50]"
      style={{
        pointerEvents: isCommentMode ? "auto" : "none",
        cursor: isCommentMode ? "crosshair" : "default",
      }}
      onClick={handleOverlayClick}
    >
      {/* Thread popover for the currently open thread */}
      {openThreadId &&
        (() => {
          const thread = threads?.find((t) => t.id === openThreadId);
          if (!thread || thread.resolved) return null;
          const pos = getShapeScreenPos(openThreadId);
          if (!pos) return null;

          return (
            <div
              key={thread.id}
              data-comment-thread
              className="absolute"
              style={{
                left: pos.x + 32,
                top: pos.y - 4,
                zIndex: 1000,
                pointerEvents: "auto",
              }}
            >
              <div
                className="w-[340px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Thread
                  thread={thread}
                  className="!border-0 !shadow-none"
                />
              </div>
            </div>
          );
        })()}

      {/* New comment composer */}
      {newCommentPos && (
        <div
          data-comment-composer
          className="absolute w-[340px] bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden"
          style={{
            left: newCommentPos.screenX,
            top: newCommentPos.screenY,
            zIndex: 1001,
            pointerEvents: "auto",
            transform: "translate(-12px, -12px)",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Pin marker for new comment */}
          <div
            className="absolute -top-2 -left-0 w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center shadow-md border-2 border-white"
            style={{ transform: "translate(-12px, -12px)" }}
          >
            <IconChat css={{ width: 14, height: 14, color: 'white' }} />
          </div>
          <Composer onComposerSubmit={handleComposerSubmit} autoFocus />
        </div>
      )}
    </div>
  );
}
