import { useCallback, useRef } from "react";
import { Editor } from "tldraw";
import { InstancePresenceRecordType } from "@tldraw/tlschema";

/**
 * Hook to manage AI's collaborator cursor on the canvas.
 * Creates a fake presence record that tldraw renders as a cursor + name badge.
 */
export function useAICursor(editorRef: React.RefObject<Editor | null>) {
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentPositionRef = useRef<{ x: number; y: number } | null>(null);

  const AI_CURSOR_ID = InstancePresenceRecordType.createId('ai-cursor');
  const AI_COLOR = '#2563EB'; // blue

  /**
   * Get a human-friendly label for a tool call
   */
  const getToolLabel = useCallback((toolName: string, args?: Record<string, unknown>): string => {
    const labelMap: Record<string, string> = {
      createSticky: "Creating stickies",
      createShape: "Creating shapes",
      createText: "Adding text",
      createFrame: "Creating frame",
      createArrow: "Drawing connections",
      createLayout: "Building layout",
      createWorkingNote: "Making notes",
      createSources: "Adding sources",
      deleteItem: "Cleaning up",
      deleteFrame: "Cleaning up",
      updateSticky: "Updating content",
      moveItem: "Rearranging",
      webSearch: "Searching the web",
      showProgress: args?.stepNumber ? `Working on step ${args.stepNumber}` : "Working...",
      confirmPlan: "Planning...",
      reviewCanvas: "Reviewing canvas",
    };

    return labelMap[toolName] || "Working...";
  }, []);

  /**
   * Calculate cursor position based on tool call arguments
   */
  const getToolPosition = useCallback((
    toolName: string,
    args: Record<string, unknown>,
    editor: Editor
  ): { x: number; y: number } | null => {
    // Tools with explicit x, y coordinates - offset cursor to point at the shape
    if ('x' in args && 'y' in args && typeof args.x === 'number' && typeof args.y === 'number') {
      return {
        x: args.x - 20,
        y: args.y - 30
      };
    }

    // Tools with shape IDs - look up shape position
    if ('id' in args && typeof args.id === 'string') {
      try {
        const bounds = editor.getShapePageBounds(args.id as any);
        if (bounds) {
          return {
            x: bounds.x - 20,
            y: bounds.y - 30
          };
        }
      } catch (e) {
        // Shape not found, keep current position
      }
    }

    // moveItem - use destination coordinates
    if (toolName === 'moveItem' && 'x' in args && 'y' in args) {
      return {
        x: (args.x as number) - 20,
        y: (args.y as number) - 30
      };
    }

    // Non-canvas tools - keep current position
    if (['webSearch', 'confirmPlan', 'reviewCanvas'].includes(toolName)) {
      return currentPositionRef.current;
    }

    // Default: viewport center
    const viewportPageBounds = editor.getViewportPageBounds();
    return {
      x: viewportPageBounds.center.x,
      y: viewportPageBounds.center.y
    };
  }, []);

  /**
   * Show the AI cursor with a label at a position
   */
  const show = useCallback((label: string, position?: { x: number; y: number }) => {
    const editor = editorRef.current;
    if (!editor) return;

    const pos = position || (() => {
      const viewportPageBounds = editor.getViewportPageBounds();
      return { x: viewportPageBounds.center.x, y: viewportPageBounds.center.y };
    })();

    currentPositionRef.current = pos;

    const presenceRecord = InstancePresenceRecordType.create({
      id: AI_CURSOR_ID,
      currentPageId: editor.getCurrentPageId(),
      userId: 'ai-cursor',
      userName: label,
      cursor: { x: pos.x, y: pos.y, type: 'default', rotation: 0 },
      color: AI_COLOR,
      camera: { x: 0, y: 0, z: 1 },
      selectedShapeIds: [],
      brush: null,
      scribbles: [],
      chatMessage: '',
      meta: {},
      followingUserId: null,
    });

    editor.store.put([presenceRecord]);
  }, [editorRef, AI_CURSOR_ID, AI_COLOR]);

  /**
   * Update cursor for a tool call - changes label and position
   */
  const updateForToolCall = useCallback((toolName: string, args: Record<string, unknown>) => {
    const editor = editorRef.current;
    if (!editor) return;

    const label = getToolLabel(toolName, args);
    const position = getToolPosition(toolName, args, editor);

    if (position) {
      currentPositionRef.current = position;
    }

    const finalPosition = position || currentPositionRef.current || (() => {
      const viewportPageBounds = editor.getViewportPageBounds();
      return { x: viewportPageBounds.center.x, y: viewportPageBounds.center.y };
    })();

    const presenceRecord = InstancePresenceRecordType.create({
      id: AI_CURSOR_ID,
      currentPageId: editor.getCurrentPageId(),
      userId: 'ai-cursor',
      userName: label,
      cursor: { x: finalPosition.x, y: finalPosition.y, type: 'default', rotation: 0 },
      color: AI_COLOR,
      camera: { x: 0, y: 0, z: 1 },
      selectedShapeIds: [],
      brush: null,
      scribbles: [],
      chatMessage: '',
      meta: {},
      followingUserId: null,
    });

    editor.store.put([presenceRecord]);
  }, [editorRef, AI_CURSOR_ID, AI_COLOR, getToolLabel, getToolPosition]);

  /**
   * Hide the AI cursor
   */
  const hide = useCallback(() => {
    const editor = editorRef.current;
    if (!editor) return;

    try {
      editor.store.remove([AI_CURSOR_ID]);
    } catch (e) {
      // Record might not exist, that's fine
    }

    currentPositionRef.current = null;
  }, [editorRef, AI_CURSOR_ID]);

  /**
   * Schedule hiding the cursor after a delay (for voice mode)
   */
  const scheduleHide = useCallback((delayMs: number) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
    }

    hideTimeoutRef.current = setTimeout(() => {
      hide();
    }, delayMs);
  }, [hide]);

  /**
   * Cancel a scheduled hide
   */
  const cancelScheduledHide = useCallback(() => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  }, []);

  return {
    show,
    updateForToolCall,
    hide,
    scheduleHide,
    cancelScheduledHide,
  };
}
