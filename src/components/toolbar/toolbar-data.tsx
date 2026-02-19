import {
  IconCursorFilled,
  IconChatLinesDot,
  IconPenTip,
  IconStickyNote,
  IconShapes,
  IconSmileySticker,
  IconShapesLines,
  IconTextT,
  IconFrame,
  IconLineStraight,
  IconEraser,
  IconCard,
  IconArticle,
  IconTable,
  IconTimelineFormat,
} from "@mirohq/design-system-icons";
import type { ComponentType } from "react";

export interface ToolItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  tldrawTool?: string;
  actionType?: "comment" | "emoji" | "plus";
}

export const primaryTools: ToolItem[] = [
  { id: "cursor", label: "Select", icon: IconCursorFilled, tldrawTool: "select" },
  { id: "comment", label: "Comment", icon: IconChatLinesDot, actionType: "comment" },
  { id: "pen", label: "Pen", icon: IconPenTip, tldrawTool: "draw" },
  { id: "sticky", label: "Sticky Note", icon: IconStickyNote, tldrawTool: "note" },
  { id: "shapes", label: "Shapes", icon: IconShapes, tldrawTool: "geo" },
  { id: "emoji", label: "Emoji", icon: IconSmileySticker, actionType: "emoji" },
  { id: "plus", label: "More", icon: IconShapesLines, actionType: "plus" },
];

export interface OverflowItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  group: "custom" | "tldraw";
  tldrawTool?: string;
}

function ApproveButtonIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
    </svg>
  );
}

function KanbanIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={style}>
      <rect x="3" y="3" width="5" height="14" rx="1" />
      <rect x="10" y="3" width="5" height="10" rx="1" />
      <rect x="17" y="3" width="5" height="18" rx="1" />
    </svg>
  );
}

export const overflowItems: OverflowItem[] = [
  // Custom shapes
  { id: "task-card", label: "Task card", icon: IconCard, group: "custom" },
  { id: "approve", label: "Approve", icon: ApproveButtonIcon, group: "custom" },
  { id: "document", label: "Document", icon: IconArticle, group: "custom" },
  { id: "data-table", label: "Data table", icon: IconTable, group: "custom" },
  { id: "timeline", label: "Timeline", icon: IconTimelineFormat, group: "custom" },
  { id: "kanban", label: "Kanban board", icon: KanbanIcon, group: "custom" },
  // tldraw tools
  { id: "text", label: "Text", icon: IconTextT, group: "tldraw", tldrawTool: "text" },
  { id: "frame", label: "Frame", icon: IconFrame, group: "tldraw", tldrawTool: "frame" },
  { id: "line", label: "Line", icon: IconLineStraight, group: "tldraw", tldrawTool: "line" },
  { id: "eraser", label: "Eraser", icon: IconEraser, group: "tldraw", tldrawTool: "eraser" },
];
