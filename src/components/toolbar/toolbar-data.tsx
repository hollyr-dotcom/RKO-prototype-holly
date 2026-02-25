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

/**
 * OverflowItem — used by both the categorized tool menu and the Toolbar handler.
 * Extended with `description` and `categoryId` for the new categorized grid.
 * The `group` field is kept for backward compatibility but derived from category.
 */
export interface OverflowItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  group: "custom" | "tldraw";
  tldrawTool?: string;
  description: string;
  categoryId: string;
}

export interface ToolCategory {
  id: string;
  label: string;
  tools: OverflowItem[];
}

// ---------- Custom SVG Icons ----------

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

function PeopleIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
    </svg>
  );
}

// ---------- Categorized Tool Data ----------

export const toolCategories: ToolCategory[] = [
  {
    id: "essentials",
    label: "Essentials",
    tools: [
      { id: "text", label: "Text", icon: IconTextT, description: "Add text to the canvas", tldrawTool: "text", group: "tldraw", categoryId: "essentials" },
      { id: "frame", label: "Frame", icon: IconFrame, description: "Create a container to group shapes", tldrawTool: "frame", group: "tldraw", categoryId: "essentials" },
      { id: "line", label: "Line", icon: IconLineStraight, description: "Draw a line or arrow", tldrawTool: "line", group: "tldraw", categoryId: "essentials" },
      { id: "eraser", label: "Eraser", icon: IconEraser, description: "Erase shapes from the canvas", tldrawTool: "eraser", group: "tldraw", categoryId: "essentials" },
    ],
  },
  {
    id: "cards-content",
    label: "Cards & Content",
    tools: [
      { id: "document", label: "Document", icon: IconArticle, description: "Create a rich text document with formatting", group: "custom", categoryId: "cards-content" },
      { id: "task-card", label: "Task Card", icon: IconCard, description: "Create a trackable task card with status and priority", group: "custom", categoryId: "cards-content" },
      { id: "slack-card", label: "Slack Card", icon: SlackIcon, description: "Create a Slack-style message card", group: "custom", categoryId: "cards-content" },
    ],
  },
  {
    id: "data-viz",
    label: "Data & Visualization",
    tools: [
      { id: "data-table", label: "Data Table", icon: IconTable, description: "Create an interactive data table", group: "custom", categoryId: "data-viz" },
      { id: "kanban", label: "Kanban", icon: KanbanIcon, description: "Create a kanban board with columns and cards", group: "custom", categoryId: "data-viz" },
      { id: "timeline", label: "Timeline", icon: IconTimelineFormat, description: "Create a timeline or Gantt chart", group: "custom", categoryId: "data-viz" },
    ],
  },
  {
    id: "workflow",
    label: "Workflow",
    tools: [
      { id: "approve", label: "Approve", icon: ApproveButtonIcon, description: "Create an approval button for workflows", group: "custom", categoryId: "workflow" },
      { id: "people-list", label: "People", icon: PeopleIcon, description: "Create a list of people", group: "custom", categoryId: "workflow" },
    ],
  },
];

/** Flat list of all overflow items — for backward compatibility and search. */
export const overflowItems: OverflowItem[] = toolCategories.flatMap((cat) => cat.tools);
