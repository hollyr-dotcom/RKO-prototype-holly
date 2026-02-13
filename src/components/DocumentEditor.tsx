"use client";

import { useEffect, useRef } from "react";
import { RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  useLiveblocksExtension,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor as TldrawEditor, TLShapeId } from "tldraw";

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
    editable: isEditing,
    immediatelyRender: false,
  });

  // Keep editable state in sync with tldraw editing state
  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
      if (isEditing) {
        editor.commands.focus();
      }
    }
  }, [editor, isEditing]);

  // Apply pending content updates from AI (updateDocument tool)
  const appliedPendingRef = useRef<string | null>(null);

  useEffect(() => {
    if (!editor || !pendingContent || pendingContent === appliedPendingRef.current) return;

    editor.commands.setContent(pendingContent);
    appliedPendingRef.current = pendingContent;

    // Clear pendingContent from shape meta so it doesn't re-apply on reload
    if (tldrawEditor && shapeId) {
      const shape = tldrawEditor.getShape(shapeId as TLShapeId);
      if (shape) {
        const meta = { ...(shape.meta as Record<string, unknown>) };
        delete meta.pendingContent;
        tldrawEditor.updateShape({ id: shape.id, type: "document", meta });
      }
    }
  }, [editor, pendingContent, tldrawEditor, shapeId]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        pointerEvents: (isSelected || isEditing) ? "all" : "none",
      }}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation();
          onEscape?.();
        }
      }}
    >
      {/* Editor content */}
      <div
        style={{
          flex: 1,
          overflow: "auto",
          padding: 74,
          fontSize: 13,
          lineHeight: 1.6,
          color: "#1f2937",
        }}
        className="document-editor-content"
      >
        <EditorContent editor={editor} />
        {isEditing && <FloatingToolbar editor={editor} />}
      </div>
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
