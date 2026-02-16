"use client";

import { useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { RoomProvider, useStorage, useMutation } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  useLiveblocksExtension,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor as TldrawEditor, TLShapeId } from "tldraw";
import { useFocusedDocId, usePortalTarget } from "@/lib/focusModeStore";

interface DocumentEditorProps {
  docId: string;
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: TldrawEditor;
  shapeId?: string;
  initialContent?: string;
  pendingContent?: string;
  w: number;
  h: number;
  onEscape?: () => void;
}

function TiptapEditor({
  docId,
  title,
  isEditing,
  isSelected,
  tldrawEditor,
  shapeId,
  initialContent,
  pendingContent,
  h,
  onEscape,
}: {
  docId: string;
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: TldrawEditor;
  shapeId?: string;
  initialContent?: string;
  pendingContent?: string;
  h: number;
  onEscape?: () => void;
}) {
  const contentRef = useRef<HTMLDivElement>(null);

  // Portal: check if this doc is in focus mode and a portal target exists
  const focusedDocId = useFocusedDocId();
  const portalTarget = usePortalTarget();
  const isInFocusMode = focusedDocId === docId && portalTarget != null;

  // In focus mode the editor is always editable
  const effectivelyEditing = isEditing || isInFocusMode;

  // Auto-resize shape to fit content after AI injects text
  const resizeShapeToFit = useCallback(() => {
    if (!tldrawEditor || !shapeId) return;
    // Small delay so Tiptap finishes rendering the DOM
    setTimeout(() => {
      const el = contentRef.current;
      if (!el) return;
      const contentHeight = el.scrollHeight;
      const shape = tldrawEditor.getShape(shapeId as TLShapeId);
      if (!shape) return;
      const currentH = (shape.props as Record<string, unknown>).h as number;
      // Only grow, never shrink (user might have manually resized smaller)
      if (contentHeight + 20 > currentH) {
        tldrawEditor.updateShape({
          id: shape.id,
          type: "document",
          props: { h: contentHeight + 20 },
        });
      }
    }, 150);
  }, [tldrawEditor, shapeId]);

  const liveblocks = useLiveblocksExtension({
    initialContent: initialContent || undefined,
  });

  const editor = useEditor({
    extensions: [
      liveblocks,
      StarterKit.configure({
        undoRedo: false,
      }),
    ],
    editable: effectivelyEditing,
    immediatelyRender: false,
  });

  // Keep editable state in sync
  useEffect(() => {
    if (editor) {
      editor.setEditable(effectivelyEditing);
      if (effectivelyEditing && !isInFocusMode) {
        editor.commands.focus();
      }
    }
  }, [editor, effectivelyEditing, isInFocusMode]);

  // Apply initial content when document is first created
  const appliedInitialRef = useRef(false);

  useEffect(() => {
    if (!editor || !initialContent || appliedInitialRef.current) return;

    const timer = setTimeout(() => {
      if (appliedInitialRef.current) return;
      const isEmpty = !editor.getText().trim();
      if (isEmpty) {
        editor.commands.setContent(initialContent);
        resizeShapeToFit();
      }
      appliedInitialRef.current = true;

      if (tldrawEditor && shapeId) {
        const shape = tldrawEditor.getShape(shapeId as TLShapeId);
        if (shape) {
          const meta = { ...(shape.meta as Record<string, unknown>) };
          delete meta.initialContent;
          tldrawEditor.updateShape({ id: shape.id, type: "document", meta });
        }
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [editor, initialContent, tldrawEditor, shapeId, resizeShapeToFit]);

  // Apply pending content updates from AI (updateDocument tool)
  const appliedPendingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor || !pendingContent || pendingContent === appliedPendingRef.current) return;

    editor.commands.setContent(pendingContent);
    appliedPendingRef.current = pendingContent;
    resizeShapeToFit();

    if (tldrawEditor && shapeId) {
      const shape = tldrawEditor.getShape(shapeId as TLShapeId);
      if (shape) {
        const meta = { ...(shape.meta as Record<string, unknown>) };
        delete meta.pendingContent;
        tldrawEditor.updateShape({ id: shape.id, type: "document", meta });
      }
    }
  }, [editor, pendingContent, tldrawEditor, shapeId, resizeShapeToFit]);

  // --- Persist content to Liveblocks Storage (survives page reloads) ---
  // Yjs docs may not persist in all Liveblocks plans, but Storage (LiveMap) does.
  const savedHtml = useStorage((root) => root.records?.get("html") as string | undefined);
  const saveToStorage = useMutation(({ storage }, html: string) => {
    storage.get("records").set("html", html);
  }, []);

  // Debounced save on every edit
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
      saveTimerRef.current = setTimeout(() => {
        try {
          saveToStorage(editor.getHTML());
        } catch {
          // Storage not loaded yet — next debounce will retry
        }
      }, 400);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [editor, saveToStorage]);

  // If Yjs doc is empty but Storage has content, restore immediately
  const restoredRef = useRef(false);

  useEffect(() => {
    if (!editor || !savedHtml || restoredRef.current) return;
    const isEmpty = !editor.getText().trim();
    if (isEmpty) {
      editor.commands.setContent(savedHtml);
      restoredRef.current = true;
    }
  }, [editor, savedHtml]);

  // The actual editor content block
  const editorContent = (
    <div
      ref={contentRef}
      style={{
        flex: 1,
        overflow: "auto",
        padding: 74,
        fontSize: 13,
        lineHeight: 1.6,
        color: "#1f2937",
        height: "100%",
      }}
      className="document-editor-content"
      onPointerDown={(e) => {
        if (effectivelyEditing) e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onEscape?.();
        }
      }}
    >
      <EditorContent editor={editor} />
      {effectivelyEditing && <FloatingToolbar editor={editor} />}
    </div>
  );

  // When in focus mode: show placeholder in the shape, portal editor to overlay.
  // When not in focus mode: render editor in the shape normally.
  if (isInFocusMode) {
    return (
      <>
        <div
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#9ca3af",
            fontSize: 13,
          }}
        >
          Editing in focus mode…
        </div>
        {createPortal(editorContent, portalTarget)}
      </>
    );
  }

  return (
    <div
      data-shape-editing={isEditing ? "true" : "false"}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onPointerDown={(e) => {
        if (isEditing) e.stopPropagation();
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.stopPropagation();
          onEscape?.();
        }
      }}
    >
      {editorContent}
    </div>
  );
}

export function DocumentEditor({
  docId,
  title,
  isEditing,
  isSelected,
  tldrawEditor,
  shapeId,
  initialContent,
  pendingContent,
  w,
  h,
  onEscape,
}: DocumentEditorProps) {
  if (!docId) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#9ca3af",
          fontSize: 13,
        }}
      >
        No document ID
      </div>
    );
  }

  const roomId = `doc-${docId}`;

  return (
    <RoomProvider
      id={roomId}
      initialPresence={{ presence: null }}
      initialStorage={{ records: new LiveMap() }}
    >
      <TiptapEditor
        docId={docId}
        title={title}
        isEditing={isEditing}
        isSelected={isSelected}
        tldrawEditor={tldrawEditor}
        shapeId={shapeId}
        initialContent={initialContent}
        pendingContent={pendingContent}
        h={h}
        onEscape={onEscape}
      />
    </RoomProvider>
  );
}
