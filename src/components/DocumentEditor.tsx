"use client";

import { useEffect } from "react";
import { RoomProvider } from "@/liveblocks.config";
import { LiveMap } from "@liveblocks/client";
import {
  useLiveblocksExtension,
  FloatingToolbar,
} from "@liveblocks/react-tiptap";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Editor as TldrawEditor } from "tldraw";

interface DocumentEditorProps {
  docId: string;
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: TldrawEditor;
  w: number;
  h: number;
  onEscape?: () => void;
}

function TiptapEditor({
  title,
  isEditing,
  isSelected,
  tldrawEditor,
  h,
  onEscape,
}: {
  title: string;
  isEditing: boolean;
  isSelected?: boolean;
  tldrawEditor?: TldrawEditor;
  h: number;
  onEscape?: () => void;
}) {
  const liveblocks = useLiveblocksExtension();

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
      <TiptapEditor title={title} isEditing={isEditing} isSelected={isSelected} tldrawEditor={tldrawEditor} h={h} onEscape={onEscape} />
    </RoomProvider>
  );
}
