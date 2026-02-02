"use client";

import { Tldraw, Editor, createShapeId, toRichText, TLShapeId } from "tldraw";
import "tldraw/tldraw.css";
import { useState, useCallback, useRef } from "react";
import { useAgent } from "@/hooks/useAgent";
import { Toolbar } from "./Toolbar";
import { ChatPanel } from "./ChatPanel";
import { IconSingleSparksFilled } from "@mirohq/design-system-icons";
import { calculateLayout, findEmptyCanvasSpace } from "@/lib/layoutEngine";
import type { LayoutType, LayoutItem, LayoutOptions } from "@/types/layout";

// Valid tldraw colors
type TLColor =
  | "yellow"
  | "blue"
  | "green"
  | "orange"
  | "violet"
  | "black"
  | "red"
  | "grey"
  | "light-blue"
  | "light-green"
  | "light-red"
  | "light-violet"
  | "white";

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
  "light-blue": "light-blue",
  "light-green": "light-green",
  "light-violet": "light-violet",
  grey: "grey",
  white: "white",
};

export function Canvas() {
  const [editor, setEditor] = useState<Editor | null>(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [input, setInput] = useState("");
  const createdShapesRef = useRef<TLShapeId[]>([]);

  // Find a non-overlapping position for a new item
  const findNonOverlappingPosition = useCallback(
    (proposedX: number, proposedY: number, width: number, height: number, itemType: string = "default"): { x: number; y: number } => {
      if (!editor) return { x: proposedX, y: proposedY };

      const shapes = editor.getCurrentPageShapes();
      const padding = 20; // Gap between items

      // Filter shapes to check against based on item type
      // - Stickies/shapes/text should NOT collide with frames (they go inside frames)
      // - Frames should collide with other frames
      const shapesToCheck = itemType === "frame"
        ? shapes.filter(s => s.type === "frame")
        : shapes.filter(s => s.type !== "frame");

      // Get all existing bounding boxes
      const existingBoxes = shapesToCheck.map((shape) => {
        const bounds = editor.getShapeGeometry(shape.id).bounds;
        return {
          x: shape.x,
          y: shape.y,
          width: bounds.width,
          height: bounds.height,
          right: shape.x + bounds.width,
          bottom: shape.y + bounds.height,
        };
      });

      // Check if a position overlaps with any existing shape
      const hasOverlap = (x: number, y: number, w: number, h: number) => {
        return existingBoxes.some((box) => {
          return !(
            x + w + padding < box.x ||
            x > box.right + padding ||
            y + h + padding < box.y ||
            y > box.bottom + padding
          );
        });
      };

      // If no overlap, use proposed position
      if (!hasOverlap(proposedX, proposedY, width, height)) {
        return { x: proposedX, y: proposedY };
      }

      // Try to find a free position - search in a grid pattern
      const gridStep = Math.max(width, height) + padding + 30;
      for (let attempts = 0; attempts < 50; attempts++) {
        // Try positions to the right first, then below
        const offsetX = (attempts % 10) * gridStep;
        const offsetY = Math.floor(attempts / 10) * gridStep;

        const testX = proposedX + offsetX;
        const testY = proposedY + offsetY;

        if (!hasOverlap(testX, testY, width, height)) {
          return { x: testX, y: testY };
        }
      }

      // Fallback: place far to the right
      const maxRight = existingBoxes.reduce((max, box) => Math.max(max, box.right), 0);
      return { x: maxRight + 100, y: proposedY };
    },
    [editor]
  );

  // Handle tool calls from the agent
  const handleToolCall = useCallback(
    (toolName: string, args: Record<string, unknown>) => {
      if (!editor) return;

      let shapeId: TLShapeId | null = null;

      if (toolName === "createSticky") {
        const { text, x, y, color } = args as {
          text: string;
          x: number;
          y: number;
          color: string;
        };

        // Find non-overlapping position (stickies are ~200x200)
        // Pass "sticky" type so it doesn't collide with frames (stickies go inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, 200, 200, "sticky");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x: pos.x,
          y: pos.y,
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

        const geoMap: Record<
          string,
          "rectangle" | "ellipse" | "triangle" | "diamond"
        > = {
          rectangle: "rectangle",
          ellipse: "ellipse",
          triangle: "triangle",
          diamond: "diamond",
        };

        // Ensure valid dimensions (minimum 50px)
        const validWidth = Math.max(width || 150, 50);
        const validHeight = Math.max(height || 80, 50);

        // Find non-overlapping position (shapes can be inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, validWidth, validHeight, "shape");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "geo",
          x: pos.x,
          y: pos.y,
          props: {
            geo: geoMap[type] || "rectangle",
            w: validWidth,
            h: validHeight,
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

        // Estimate text size (roughly 10px per char width, 30px height)
        const estimatedWidth = Math.max(text.length * 10, 100);
        const estimatedHeight = 40;

        // Find non-overlapping position (text can be inside frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, estimatedWidth, estimatedHeight, "text");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "text",
          x: pos.x,
          y: pos.y,
          props: {
            richText: toRichText(text),
            size: "m",
          },
        });
      }

      if (toolName === "createFrame") {
        const { name, x, y, width, height } = args as {
          name: string;
          x: number;
          y: number;
          width: number;
          height: number;
        };

        // Ensure valid dimensions (minimum 100px for frames)
        const validWidth = Math.max(width || 400, 100);
        const validHeight = Math.max(height || 300, 100);

        // Find non-overlapping position (frames only check against other frames)
        const pos = findNonOverlappingPosition(x || 0, y || 0, validWidth, validHeight, "frame");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "frame",
          x: pos.x,
          y: pos.y,
          props: {
            name: name || "Frame",
            w: validWidth,
            h: validHeight,
          },
        });
      }

      if (toolName === "createArrow") {
        const { startX, startY, endX, endY } = args as {
          startX: number;
          startY: number;
          endX: number;
          endY: number;
        };

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "arrow",
          x: startX,
          y: startY,
          props: {
            start: { x: 0, y: 0 },
            end: { x: endX - startX, y: endY - startY },
          },
        });
      }

      // Working notes - larger sticky with distinct color
      if (toolName === "createWorkingNote") {
        const { title, content, x, y } = args as {
          title: string;
          content: string;
          x: number;
          y: number;
        };

        // Working notes are larger - approximately 300x300
        const pos = findNonOverlappingPosition(x || 0, y || 0, 300, 300, "note");

        shapeId = createShapeId();
        editor.createShape({
          id: shapeId,
          type: "note",
          x: pos.x,
          y: pos.y,
          props: {
            richText: toRichText(`${title}\n\n${content}`),
            color: "light-violet",
            size: "l",
          },
        });
      }

      // CREATE LAYOUT - auto-positioned content with frame
      if (toolName === "createLayout") {
        const { layout } = args as {
          layout: {
            type: LayoutType;
            frameName: string;
            items: Array<{
              type: "sticky" | "shape" | "text";
              text: string;
              color?: string;
              parentIndex?: number;
            }>;
            options?: LayoutOptions;
          };
        };

        // Convert to LayoutItem array
        const layoutItems: LayoutItem[] = layout.items.map((item) => ({
          type: item.type,
          text: item.text,
          color: item.color,
          parentIndex: item.parentIndex,
        }));

        // Calculate the layout
        const result = calculateLayout(layout.type, layoutItems, layout.options);

        // Find empty space on canvas for this layout
        const canvasPos = findEmptyCanvasSpace(editor, result.frame.width, result.frame.height);

        // Create the frame
        const frameId = createShapeId();
        editor.createShape({
          id: frameId,
          type: "frame",
          x: canvasPos.x,
          y: canvasPos.y,
          props: {
            name: layout.frameName,
            w: result.frame.width,
            h: result.frame.height,
          },
        });
        createdShapesRef.current.push(frameId);

        // Create all items at calculated positions
        result.items.forEach(({ item, position }) => {
          const itemId = createShapeId();
          const itemX = canvasPos.x + position.x;
          const itemY = canvasPos.y + position.y;

          if (item.type === "sticky") {
            editor.createShape({
              id: itemId,
              type: "note",
              x: itemX,
              y: itemY,
              props: {
                richText: toRichText(item.text),
                color: colorMap[item.color || "yellow"] || "yellow",
                size: "m",
              },
            });
          } else if (item.type === "shape") {
            // Create the shape
            editor.createShape({
              id: itemId,
              type: "geo",
              x: itemX,
              y: itemY,
              props: {
                geo: "rectangle",
                w: position.width,
                h: position.height,
                color: colorMap[item.color || "blue"] || "blue",
              },
            });
            // Create text label centered on shape
            const textId = createShapeId();
            editor.createShape({
              id: textId,
              type: "text",
              x: itemX + position.width / 2 - 50, // Roughly center
              y: itemY + position.height / 2 - 15,
              props: {
                richText: toRichText(item.text),
                size: "s",
                textAlign: "middle",
              },
            });
            createdShapesRef.current.push(textId);
          } else if (item.type === "text") {
            editor.createShape({
              id: itemId,
              type: "text",
              x: itemX,
              y: itemY,
              props: {
                richText: toRichText(item.text),
                size: "m",
              },
            });
          }

          createdShapesRef.current.push(itemId);
        });

        // Create arrows if any
        result.arrows.forEach((arrow) => {
          const arrowId = createShapeId();
          editor.createShape({
            id: arrowId,
            type: "arrow",
            x: canvasPos.x + arrow.startX,
            y: canvasPos.y + arrow.startY,
            props: {
              start: { x: 0, y: 0 },
              end: {
                x: arrow.endX - arrow.startX,
                y: arrow.endY - arrow.startY,
              },
            },
          });
          createdShapesRef.current.push(arrowId);
        });

        // Don't set shapeId since we created multiple shapes
        return;
      }

      // Delete item from canvas
      if (toolName === "deleteItem") {
        const { itemId } = args as { itemId: string };
        // Find shape by ID - tldraw IDs are prefixed with "shape:"
        const allShapes = editor.getCurrentPageShapes();
        const shapeToDelete = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToDelete) {
          editor.deleteShape(shapeToDelete.id);
        }
      }

      // Update existing sticky note
      if (toolName === "updateSticky") {
        const { itemId, newText, newColor } = args as {
          itemId: string;
          newText: string;
          newColor: string;
        };
        const allShapes = editor.getCurrentPageShapes();
        const shapeToUpdate = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToUpdate && shapeToUpdate.type === "note") {
          editor.updateShape({
            id: shapeToUpdate.id,
            type: "note",
            props: {
              richText: toRichText(newText),
              color: colorMap[newColor] || "yellow",
            },
          });
        }
      }

      // Move item to new position
      if (toolName === "moveItem") {
        const { itemId, x, y } = args as {
          itemId: string;
          x: number;
          y: number;
        };
        const allShapes = editor.getCurrentPageShapes();
        const shapeToMove = allShapes.find(
          (s) => s.id === itemId || s.id === `shape:${itemId}`
        );
        if (shapeToMove) {
          editor.updateShape({
            id: shapeToMove.id,
            type: shapeToMove.type,
            x,
            y,
          });
        }
      }

      // Track created shape (removed auto-zoom - was too jumpy)
      if (shapeId) {
        createdShapesRef.current.push(shapeId);
      }
    },
    [editor, findNonOverlappingPosition]
  );

  // Get canvas state for agent context
  const getCanvasState = useCallback(() => {
    if (!editor) return [];
    const shapes = editor.getCurrentPageShapes();
    return shapes.map((shape) => {
      const props = shape.props as Record<string, unknown>;
      // Extract text from richText if present
      let text: string | undefined;
      if (props.richText) {
        const richText = props.richText as { content?: Array<{ content?: Array<{ text?: string }> }> };
        text = richText.content
          ?.flatMap((block) => block.content?.map((inline) => inline.text) || [])
          .join("") || undefined;
      }
      // Get bounds for the shape to include width/height
      const bounds = editor.getShapeGeometry(shape.id).bounds;
      return {
        id: shape.id,
        type: shape.type,
        text,
        color: props.color as string | undefined,
        x: Math.round(shape.x),
        y: Math.round(shape.y),
        width: Math.round(bounds.width),
        height: Math.round(bounds.height),
      };
    });
  }, [editor]);

  const { messages, append, isLoading } = useAgent(handleToolCall, getCanvasState);

  const handleMount = useCallback((editor: Editor) => {
    setEditor(editor);
  }, []);

  const handleSubmit = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      append({ role: "user", content: text });
      setInput("");
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
              boxShadow:
                "0 4px 24px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)",
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
