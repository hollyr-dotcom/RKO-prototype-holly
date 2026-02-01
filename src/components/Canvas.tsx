"use client";

import { Tldraw, Editor } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback } from "react";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  return (
    <div className="h-screen w-screen flex">
      {/* Main canvas area */}
      <div className="flex-1 relative">
        <Tldraw
          onMount={handleMount}
          hideUi
        />

        {/* Custom toolbar at bottom center */}
        <Toolbar
          editor={editor}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
        />
      </div>

      {/* Side chat panel */}
      {isChatOpen && (
        <ChatPanel onClose={() => setIsChatOpen(false)} />
      )}
    </div>
  );
}
