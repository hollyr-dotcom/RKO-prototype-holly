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

function SlackIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={style}>
      <g transform="scale(0.75) translate(4,4)">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#2EB67D"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.52-2.52A2.528 2.528 0 0 1 8.833 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.52A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#ECB22E"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
      </g>
    </svg>
  );
}

export const overflowItems: OverflowItem[] = [
  // Custom shapes
  { id: "task-card", label: "Task card", icon: IconCard, group: "custom" },
  { id: "slack-card", label: "Slack card", icon: SlackIcon, group: "custom" },
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
