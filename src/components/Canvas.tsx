"use client";

import { Tldraw, Editor, createShapeId, toRichText, TLShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef } from "react";
import { useChat } from "ai/react";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";
import { IconSingleSparksFilled } from "@mirohq/design-system-icons";

// Valid tldraw colors
type TLColor = "yellow" | "blue" | "green" | "orange" | "violet" | "black" | "red" | "grey" | "light-blue" | "light-green" | "light-red" | "light-violet" | "white";

// Map AI color names to tldraw colors
const colorMap: Record<string, TLColor> = {
  yellow: "yellow",
  blue: "blue",
  green: "green",
  pink: "red",
  orange: "orange",
  violet: "violet",
  black: "black",
  red: "red",
};

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const createdShapesRef = useRef<TLShapeId[]>([]);

  const { messages, input, setInput, append, isLoading } = useChat({
    api: "/api/chat",
    onToolCall: async ({ toolCall }) => {
      if (!editor) return;

      const { toolName, args } = toolCall;
      let shapeId: TLShapeId | null = null;

      if (toolName === "createSticky") {
        const { text, x, y, color } = args as {
          text: string;
          x: number;
          y: number;
          color: string;
        };

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x,
          y,
          props: {
            richText: toRichText(text),
            color: colorMap[color] || "yellow",
            size: "m",
          },
        });
      }

      if (toolName === "createShape") {
        const { type, x, y, width, height, color } = args as {
          type: string;
          x: number;
          y: number;
          width: number;
          height: number;
          color: string;
        };

        const geoMap: Record<string, "rectangle" | "ellipse" | "triangle" | "diamond"> = {
          rectangle: "rectangle",
          ellipse: "ellipse",
          triangle: "triangle",
          diamond: "diamond",
        };

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "geo",
          x,
          y,
          props: {
            geo: geoMap[type] || "rectangle",
            w: width,
            h: height,
            color: colorMap[color] || "black",
          },
        });
      }

      if (toolName === "createText") {
        const { text, x, y } = args as {
          text: string;
          x: number;
          y: number;
        };

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "text",
          x,
          y,
          props: {
            richText: toRichText(text),
            size: "m",
          },
        });
      }

      // Track created shape for zooming later
      if (shapeId) {
        createdShapesRef.current.push(shapeId);
      }
    },
    onFinish: () => {
      // Zoom to created shapes when AI finishes responding
      if (editor && createdShapesRef.current.length > 0) {
        editor.select(...createdShapesRef.current);
        editor.zoomToSelection({ animation: { duration: 300 } });
        // Clear for next response
        createdShapesRef.current = [];
      }
    },
  });

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      append({ role: "user", content: text });
      if (!isChatOpen) {
        setIsChatOpen(true);
      }
    },
    [append, isChatOpen]
  );

  return (
    <div className="h-screen w-screen flex overflow-hidden">
      {/* Main canvas area */}
      <div className="flex-1 relative transition-all duration-300 ease-out">
        <Tldraw onMount={handleMount} hideUi />

        {/* AI Chat button - top right, hidden when panel is open */}
        {!isChatOpen && (
          <button
            onClick={() => setIsChatOpen(true)}
            className="absolute top-4 right-4 z-50 w-12 h-12 bg-gray-900 text-white rounded-full flex items-center justify-center transition-all duration-200 hover:bg-gray-800"
            style={{
              boxShadow: "0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
            }}
            title="AI Chat"
          >
            <IconSingleSparksFilled size="medium" />
          </button>
        )}

        {/* Custom toolbar at bottom center */}
        <Toolbar
          editor={editor}
          onToggleChat={() => setIsChatOpen(!isChatOpen)}
          isChatOpen={isChatOpen}
          onSubmit={handleSubmit}
          isLoading={isLoading}
        />
      </div>

      {/* Side chat panel */}
      {isChatOpen && (
        <div className="w-96 flex-shrink-0 transition-all duration-300 ease-out">
          <ChatPanel
            onClose={() => setIsChatOpen(false)}
            messages={messages}
            input={input}
            setInput={setInput}
            onSubmit={handleSubmit}
            isLoading={isLoading}
          />
        </div>
      )}
    </div>
  );
}
