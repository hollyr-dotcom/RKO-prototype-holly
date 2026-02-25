import {
  // Primary toolbar icons
  IconCursorFilled,
  IconChatLinesDot,
  IconPenTip,
  IconStickyNote,
  IconShapes,
  IconSmileySticker,
  IconShapesLines,
  // Essentials (overflow)
  IconTextT,
  IconFrame,
  IconLineStraight,
  IconEraser,
  IconCard,
  IconArticle,
  IconTable,
  IconTimelineFormat,
  // Formats
  IconPrototypeFormat,
  IconDiagramming,
  IconTableFormat,
  IconKanban,
  IconDocFormat,
  IconSlideFormat,
  IconActivity,
  IconChartBarY,
  IconMap,
  // Essentials (expanded)
  IconChartLine,
  IconBracketsAngleSlash,
  IconFlipCard,
  IconGrid,
  IconNodesConnected,
  IconNotepad,
  IconPeopleList,
  IconSquaresGroup,
  IconStickyNoteStack,
  IconRectanglesLayout,
  IconTimer,
  IconUser,
  // Customizable Widgets
  IconLightning,
  IconAiText,
  IconCounter,
  // Diagramming
  IconSocialAws,
  IconCoinsChecked,
  IconDiagrammingShapes,
  IconSocialDrawio,
  IconStack,
  IconMermaid,
  IconOrgChart,
  IconShapesLinesStacked,
  // Planning
  IconSocialAsana,
  IconClickup,
  IconWidgetColumns,
  IconDotLineDot,
  IconChartProgress,
  IconSocialJira,
  IconLinear,
  IconCalendarBlank,
  IconCardsPoker,
  IconRally,
  IconFileSpreadsheet,
  IconStoryPoints,
  IconTshirt,
  IconTrello,
  IconRectanglesThreeAligned,
  // Activities
  IconQrCode,
  IconCheckBoxLines,
  IconChatContent,
  IconWordCloud,
  // Collaboration
  IconAlignmentScale,
  IconFrameLinesTwo,
  IconDotVoting,
  IconPolling,
  IconEyeClosed,
  IconThumbsUp,
  // Media
  IconImage,
  IconPalette,
  IconBadge,
  IconImageSparkle,
  IconMicrophone,
  IconArrowUpCircle,
  IconVideoCamera,
  // Marketplace & Other
  IconCube,
  IconBookmark,
  IconNodesConnectionsThree,
  IconFormula,
  IconCluster,
  IconShuffle,
  IconBrush,
  IconGlobe,
  IconSquarePencil,
  IconGithub,
  IconDownload,
  IconSparksFilled,
  IconPushPin,
  IconExport,
  IconMagnifyingGlass,
  IconGridFour,
  IconCloud,
  IconSelect,
  IconPresentationPlay,
  IconMagnifyingGlassPlus,
  IconScissors,
  IconPlug,
  IconPlaceholder,
  IconNodeLinesHorizontal,
  IconAltText,
  IconLayout,
  IconTag,
  IconBrowser,
  IconInsights,
  IconInsightsSearch,
  IconPresentationArrow,
  IconChartNumber,
  IconAiCursor,
  IconCoins,
  IconCamera,
  IconUsersThree,
  IconBoard,
  IconHeart,
  IconSquaresRow,
  IconConeSerpentine,
  IconStickyCorners,
  IconStickyNotesTwo,
  IconTennisBall,
  IconPlaybackSpeedCircle,
  IconTextAHorizontal,
  IconRectangleArrowUpCenter,
} from "@mirohq/design-system-icons";
import type { ComponentType } from "react";

// ─── Primary Toolbar ────────────────────────────────────────────────────────

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

// ─── Overflow Menu ──────────────────────────────────────────────────────────

export interface OverflowItem {
  id: string;
  label: string;
  icon: ComponentType<any>;
  group: "custom" | "tldraw" | "placeholder";
  tldrawTool?: string;
  description: string;
  categoryId: string;
}

export interface ToolCategory {
  id: string;
  label: string;
  tools: OverflowItem[];
}

// ---------- Custom SVG Icons (for tools without a Miro DS icon) ----------

function ApproveButtonIcon({ style }: { style?: React.CSSProperties }) {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" style={style}>
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
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

// ─── Categorized Tool Data ──────────────────────────────────────────────────

export const toolCategories: ToolCategory[] = [
  // ════════════════════════════════════════════════════════════════════════
  // FORMATS
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "formats",
    label: "Formats",
    tools: [
      { id: "prototype", label: "Prototype", icon: IconPrototypeFormat, group: "placeholder", description: "Create an interactive prototype", categoryId: "formats" },
      { id: "diagram", label: "Diagram", icon: IconDiagramming, group: "placeholder", description: "Create a diagram", categoryId: "formats" },
      { id: "table-format", label: "Table", icon: IconTableFormat, group: "placeholder", description: "Create a structured table", categoryId: "formats" },
      { id: "timeline-format", label: "Timeline", icon: IconTimelineFormat, group: "placeholder", description: "Create a timeline view", categoryId: "formats" },
      { id: "kanban-format", label: "Kanban", icon: IconKanban, group: "placeholder", description: "Create a kanban board view", categoryId: "formats" },
      { id: "doc-format", label: "Doc", icon: IconDocFormat, group: "placeholder", description: "Create a document", categoryId: "formats" },
      { id: "slides-format", label: "Slides", icon: IconSlideFormat, group: "placeholder", description: "Create a slide deck", categoryId: "formats" },
      { id: "activities-format", label: "Activities", icon: IconActivity, group: "placeholder", description: "Create an activities view", categoryId: "formats" },
      { id: "dashboard-format", label: "Dashboard", icon: IconChartBarY, group: "placeholder", description: "Create a dashboard", categoryId: "formats" },
      { id: "journey-map", label: "Journey Map", icon: IconMap, group: "placeholder", description: "Create a journey map", categoryId: "formats" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // ESSENTIALS
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "essentials",
    label: "Essentials",
    tools: [
      { id: "pen-tool", label: "Pen", icon: IconPenTip, group: "tldraw", tldrawTool: "draw", description: "Freehand drawing tool", categoryId: "essentials" },
      { id: "sticky-note", label: "Sticky note", icon: IconStickyNote, group: "tldraw", tldrawTool: "note", description: "Add a sticky note", categoryId: "essentials" },
      { id: "card-tool", label: "Card", icon: IconCard, group: "custom", description: "Create a trackable task card with status and priority", categoryId: "essentials" },
      { id: "chart", label: "Chart", icon: IconChartLine, group: "placeholder", description: "Create a chart visualization", categoryId: "essentials" },
      { id: "code-block", label: "Code block", icon: IconBracketsAngleSlash, group: "placeholder", description: "Add a code block", categoryId: "essentials" },
      { id: "comment-tool", label: "Comment", icon: IconChatLinesDot, group: "placeholder", description: "Add a comment to the canvas", categoryId: "essentials" },
      { id: "flip-card", label: "Flip card", icon: IconFlipCard, group: "placeholder", description: "Create a flip card", categoryId: "essentials" },
      { id: "frame", label: "Frame", icon: IconFrame, group: "tldraw", tldrawTool: "frame", description: "Create a container to group shapes", categoryId: "essentials" },
      { id: "grid-tool", label: "Grid", icon: IconGrid, group: "placeholder", description: "Add a grid to the canvas", categoryId: "essentials" },
      { id: "mind-map", label: "Mind map", icon: IconNodesConnected, group: "placeholder", description: "Create a mind map", categoryId: "essentials" },
      { id: "note", label: "Note", icon: IconNotepad, group: "placeholder", description: "Add a note", categoryId: "essentials" },
      { id: "people", label: "People", icon: IconPeopleList, group: "custom", description: "Create a list of people", categoryId: "essentials" },
      { id: "prototyping-library", label: "Prototyping library", icon: IconSquaresGroup, group: "placeholder", description: "Browse prototyping components", categoryId: "essentials" },
      { id: "sticky-stack", label: "Sticky stack", icon: IconStickyNoteStack, group: "placeholder", description: "Create a stack of sticky notes", categoryId: "essentials" },
      { id: "templates", label: "Templates", icon: IconRectanglesLayout, group: "placeholder", description: "Browse templates", categoryId: "essentials" },
      { id: "text", label: "Text", icon: IconTextT, group: "tldraw", tldrawTool: "text", description: "Add text to the canvas", categoryId: "essentials" },
      { id: "timer-tool", label: "Timer", icon: IconTimer, group: "placeholder", description: "Add a timer", categoryId: "essentials" },
      { id: "user-card", label: "User card", icon: IconUser, group: "placeholder", description: "Create a user card", categoryId: "essentials" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // CUSTOMIZABLE WIDGETS
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "widgets",
    label: "Customizable Widgets",
    tools: [
      { id: "action-shortcut", label: "Action Shortcut", icon: IconLightning, group: "placeholder", description: "Add an action shortcut button", categoryId: "widgets" },
      { id: "ai-instruction", label: "AI instruction", icon: IconAiText, group: "placeholder", description: "Add an AI instruction widget", categoryId: "widgets" },
      { id: "counter-widget", label: "Counter", icon: IconCounter, group: "placeholder", description: "Add a counter widget", categoryId: "widgets" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // DIAGRAMMING
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "diagramming",
    label: "Diagramming",
    tools: [
      { id: "aws-cloud-view", label: "AWS Cloud View", icon: IconSocialAws, group: "placeholder", description: "Create AWS architecture diagrams", categoryId: "diagramming" },
      { id: "aws-cost-calc", label: "AWS Cost Calculator", icon: IconCoinsChecked, group: "placeholder", description: "Calculate AWS costs", categoryId: "diagramming" },
      { id: "diagramming-shapes", label: "Diagramming shapes", icon: IconDiagrammingShapes, group: "placeholder", description: "Standard diagramming shape library", categoryId: "diagramming" },
      { id: "drawio", label: "Draw.io Diagrams", icon: IconSocialDrawio, group: "placeholder", description: "Create Draw.io diagrams", categoryId: "diagramming" },
      { id: "layers", label: "Layers", icon: IconStack, group: "placeholder", description: "Manage layers", categoryId: "diagramming" },
      { id: "mermaid", label: "Mermaid Diagrams", icon: IconMermaid, group: "placeholder", description: "Create Mermaid diagrams", categoryId: "diagramming" },
      { id: "org-chart", label: "Org chart", icon: IconOrgChart, group: "placeholder", description: "Create an organizational chart", categoryId: "diagramming" },
      { id: "plantuml", label: "PlantUML Diagrams", icon: IconDiagramming, group: "placeholder", description: "Create PlantUML diagrams", categoryId: "diagramming" },
      { id: "shapes-lines", label: "Shapes and lines", icon: IconShapesLinesStacked, group: "tldraw", tldrawTool: "geo", description: "Draw shapes and lines", categoryId: "diagramming" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // PLANNING
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "planning",
    label: "Planning",
    tools: [
      { id: "asana", label: "Asana", icon: IconSocialAsana, group: "placeholder", description: "Import from Asana", categoryId: "planning" },
      { id: "azure-cards", label: "Azure Cards", icon: IconCard, group: "placeholder", description: "Create Azure DevOps cards", categoryId: "planning" },
      { id: "ca-agile", label: "CA Agile", icon: IconPlaceholder, group: "placeholder", description: "Import from CA Agile Central", categoryId: "planning" },
      { id: "clickup", label: "ClickUp", icon: IconClickup, group: "placeholder", description: "Import from ClickUp", categoryId: "planning" },
      { id: "columns", label: "Columns", icon: IconWidgetColumns, group: "placeholder", description: "Create columns layout", categoryId: "planning" },
      { id: "dependencies", label: "Dependencies", icon: IconDotLineDot, group: "placeholder", description: "Show task dependencies", categoryId: "planning" },
      { id: "estimation", label: "Estimation", icon: IconChartProgress, group: "placeholder", description: "Estimate effort", categoryId: "planning" },
      { id: "jira-cards", label: "Jira Cards", icon: IconSocialJira, group: "placeholder", description: "Import from Jira", categoryId: "planning" },
      { id: "linear-tool", label: "Linear", icon: IconLinear, group: "placeholder", description: "Import from Linear", categoryId: "planning" },
      { id: "planner", label: "Planner", icon: IconCalendarBlank, group: "placeholder", description: "Open the program board planner", categoryId: "planning" },
      { id: "planning-poker", label: "Planning Poker", icon: IconCardsPoker, group: "placeholder", description: "Run a planning poker session", categoryId: "planning" },
      { id: "rally-tool", label: "Rally", icon: IconRally, group: "placeholder", description: "Import from Rally", categoryId: "planning" },
      { id: "smartsheet", label: "Smartsheet", icon: IconFileSpreadsheet, group: "placeholder", description: "Import from Smartsheet", categoryId: "planning" },
      { id: "story-points", label: "Story points", icon: IconStoryPoints, group: "placeholder", description: "Add story point estimates", categoryId: "planning" },
      { id: "tshirt-sizing", label: "T-shirt sizing", icon: IconTshirt, group: "placeholder", description: "T-shirt size estimation", categoryId: "planning" },
      { id: "trello-tool", label: "Trello", icon: IconTrello, group: "placeholder", description: "Import from Trello", categoryId: "planning" },
      { id: "user-story-mapping", label: "User story mapping", icon: IconRectanglesThreeAligned, group: "placeholder", description: "Create a user story map", categoryId: "planning" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // ACTIVITIES
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "activities",
    label: "Activities",
    tools: [
      { id: "joining-code", label: "Joining code", icon: IconQrCode, group: "placeholder", description: "Generate a joining code", categoryId: "activities" },
      { id: "multiple-choice", label: "Multiple choice", icon: IconCheckBoxLines, group: "placeholder", description: "Create a multiple choice activity", categoryId: "activities" },
      { id: "open-ended", label: "Open-ended", icon: IconChatContent, group: "placeholder", description: "Create an open-ended question", categoryId: "activities" },
      { id: "word-cloud-activity", label: "Word cloud", icon: IconWordCloud, group: "placeholder", description: "Create a word cloud activity", categoryId: "activities" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // COLLABORATION
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "collaboration",
    label: "Collaboration",
    tools: [
      { id: "alignment-scale", label: "Alignment scale", icon: IconAlignmentScale, group: "placeholder", description: "Add an alignment scale", categoryId: "collaboration" },
      { id: "breakout-frames", label: "Breakout frames", icon: IconFrameLinesTwo, group: "placeholder", description: "Create breakout frames", categoryId: "collaboration" },
      { id: "dot-voting", label: "Dot voting", icon: IconDotVoting, group: "placeholder", description: "Run a dot voting session", categoryId: "collaboration" },
      { id: "poll", label: "Poll", icon: IconPolling, group: "placeholder", description: "Create a poll", categoryId: "collaboration" },
      { id: "private-mode", label: "Private mode", icon: IconEyeClosed, group: "placeholder", description: "Enable private mode", categoryId: "collaboration" },
      { id: "spinner-wheel", label: "Spinner wheel", icon: IconPlaybackSpeedCircle, group: "placeholder", description: "Add a spinner wheel", categoryId: "collaboration" },
      { id: "voting", label: "Voting", icon: IconThumbsUp, group: "placeholder", description: "Run a voting session", categoryId: "collaboration" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // MEDIA
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "media",
    label: "Media",
    tools: [
      { id: "images-icons", label: "Images and Icons", icon: IconImage, group: "placeholder", description: "Add images and icons", categoryId: "media" },
      { id: "adobe-express", label: "Adobe Express", icon: IconPalette, group: "placeholder", description: "Create with Adobe Express", categoryId: "media" },
      { id: "brandfetch", label: "Brandfetch", icon: IconBadge, group: "placeholder", description: "Find brand assets", categoryId: "media" },
      { id: "google-images", label: "Google Images", icon: IconImageSparkle, group: "placeholder", description: "Search Google Images", categoryId: "media" },
      { id: "stickers-emoji-gifs", label: "Stickers, Emoji and GIFs", icon: IconSmileySticker, group: "placeholder", description: "Add stickers, emoji, and GIFs", categoryId: "media" },
      { id: "talktrack", label: "Talktrack", icon: IconMicrophone, group: "placeholder", description: "Record a talktrack", categoryId: "media" },
      { id: "upload", label: "Upload", icon: IconArrowUpCircle, group: "placeholder", description: "Upload files to the canvas", categoryId: "media" },
      { id: "video", label: "Video", icon: IconVideoCamera, group: "placeholder", description: "Add a video", categoryId: "media" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // FROM MARKETPLACE
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "marketplace",
    label: "From Marketplace",
    tools: [
      { id: "3d-ar-vntana", label: "3D AR VNTANA", icon: IconCube, group: "placeholder", description: "Add 3D AR content", categoryId: "marketplace" },
      { id: "agilewalls-dropper", label: "AgileWalls Dropper", icon: IconSquaresRow, group: "placeholder", description: "AgileWalls card dropper", categoryId: "marketplace" },
      { id: "ai-rewrite-spellcheck", label: "AI Rewrite & Spell Checker", icon: IconAiText, group: "placeholder", description: "AI-powered rewrite and spell check", categoryId: "marketplace" },
      { id: "autodesk-miro", label: "Autodesk For Miro", icon: IconConeSerpentine, group: "placeholder", description: "Autodesk integration", categoryId: "marketplace" },
      { id: "avataaars", label: "Avataaars", icon: IconUser, group: "placeholder", description: "Create avatar illustrations", categoryId: "marketplace" },
      { id: "blossom", label: "Blossom", icon: IconHeart, group: "placeholder", description: "Blossom project tracker", categoryId: "marketplace" },
      { id: "board-browser", label: "Board Browser", icon: IconBoard, group: "placeholder", description: "Browse boards", categoryId: "marketplace" },
      { id: "bookmarks", label: "Bookmarks", icon: IconBookmark, group: "placeholder", description: "Save and organize bookmarks", categoryId: "marketplace" },
      { id: "bpmn-tool", label: "Bpmn Tool", icon: IconNodesConnectionsThree, group: "placeholder", description: "Create BPMN diagrams", categoryId: "marketplace" },
      { id: "brand-icons", label: "Brand Icons", icon: IconBadge, group: "placeholder", description: "Add brand icons", categoryId: "marketplace" },
      { id: "calculator", label: "Calculator", icon: IconFormula, group: "placeholder", description: "Add a calculator", categoryId: "marketplace" },
      { id: "canva-miro", label: "Canva for Miro", icon: IconPalette, group: "placeholder", description: "Design with Canva", categoryId: "marketplace" },
      { id: "clusterizer", label: "Clusterizer", icon: IconCluster, group: "placeholder", description: "Auto-cluster sticky notes", categoryId: "marketplace" },
      { id: "coda", label: "Coda", icon: IconArticle, group: "placeholder", description: "Coda integration", categoryId: "marketplace" },
      { id: "dice", label: "Dice", icon: IconShuffle, group: "placeholder", description: "Roll dice", categoryId: "marketplace" },
      { id: "drawify-images", label: "Drawify images", icon: IconBrush, group: "placeholder", description: "Create Drawify illustrations", categoryId: "marketplace" },
      { id: "drop-zone", label: "Drop Zone for Miro", icon: IconRectangleArrowUpCenter, group: "placeholder", description: "Create drop zones", categoryId: "marketplace" },
      { id: "easy-translator", label: "Easy Translator", icon: IconGlobe, group: "placeholder", description: "Translate content", categoryId: "marketplace" },
      { id: "field", label: "Field", icon: IconSquarePencil, group: "placeholder", description: "Add input fields", categoryId: "marketplace" },
      { id: "github-miro", label: "GitHub for Miro", icon: IconGithub, group: "placeholder", description: "GitHub integration", categoryId: "marketplace" },
      { id: "mind-map-downloader", label: "Mind Map Downloader", icon: IconDownload, group: "placeholder", description: "Download mind maps", categoryId: "marketplace" },
      { id: "miro-qr-pictures", label: "Miro QR Pictures", icon: IconQrCode, group: "placeholder", description: "Create QR code pictures", categoryId: "marketplace" },
      { id: "miro-qr-stickies", label: "Miro QR Stickies", icon: IconQrCode, group: "placeholder", description: "Create QR code stickies", categoryId: "marketplace" },
      { id: "noda", label: "Noda", icon: IconPlaceholder, group: "placeholder", description: "Noda integration", categoryId: "marketplace" },
      { id: "open-gpt-miro", label: "open GPT for Miro", icon: IconSparksFilled, group: "placeholder", description: "AI-powered content generation", categoryId: "marketplace" },
      { id: "pinterest-miro", label: "Pinterest for Miro", icon: IconPushPin, group: "placeholder", description: "Pinterest integration", categoryId: "marketplace" },
      { id: "pokemiro", label: "Pokémiro", icon: IconTennisBall, group: "placeholder", description: "Fun Pokémon game", categoryId: "marketplace" },
      { id: "powerpack", label: "PowerPack", icon: IconLightning, group: "placeholder", description: "PowerPack utilities", categoryId: "marketplace" },
      { id: "pptx-exporter", label: "PowerPoint Exporter for Miro", icon: IconExport, group: "placeholder", description: "Export to PowerPoint", categoryId: "marketplace" },
      { id: "qr-code-generator", label: "QR Code Generator", icon: IconQrCode, group: "placeholder", description: "Generate QR codes", categoryId: "marketplace" },
      { id: "refsee", label: "Refsee - AI Video Search", icon: IconMagnifyingGlass, group: "placeholder", description: "AI video search", categoryId: "marketplace" },
      { id: "rijksmuseum-puzzles", label: "Rijksmuseum Puzzles", icon: IconGridFour, group: "placeholder", description: "Art puzzles", categoryId: "marketplace" },
      { id: "salesforce-miro", label: "Salesforce for Miro", icon: IconCloud, group: "placeholder", description: "Salesforce integration", categoryId: "marketplace" },
      { id: "saved-selections", label: "Saved selections", icon: IconSelect, group: "placeholder", description: "Save and recall selections", categoryId: "marketplace" },
      { id: "slideshow", label: "Slideshow", icon: IconPresentationPlay, group: "placeholder", description: "Create a slideshow", categoryId: "marketplace" },
      { id: "smart-diagrams", label: "Smart Diagrams", icon: IconDiagramming, group: "placeholder", description: "AI-powered diagrams", categoryId: "marketplace" },
      { id: "spellchecker", label: "Spellchecker", icon: IconTextAHorizontal, group: "placeholder", description: "Check spelling", categoryId: "marketplace" },
      { id: "spinny-picker-wheel", label: "Spinny Picker Wheel", icon: IconPlaybackSpeedCircle, group: "placeholder", description: "Spin to pick", categoryId: "marketplace" },
      { id: "stickies-packs", label: "Stickies Packs", icon: IconStickyNotesTwo, group: "placeholder", description: "Themed sticky packs", categoryId: "marketplace" },
      { id: "sticky-art", label: "Sticky art", icon: IconStickyCorners, group: "placeholder", description: "Create art with stickies", categoryId: "marketplace" },
      { id: "super-search", label: "Super Search", icon: IconMagnifyingGlassPlus, group: "placeholder", description: "Advanced search", categoryId: "marketplace" },
      { id: "timeline-builder", label: "Timeline builder", icon: IconTimelineFormat, group: "placeholder", description: "Build timelines", categoryId: "marketplace" },
      { id: "unfurl-grafana", label: "Unfurl Grafana", icon: IconChartLine, group: "placeholder", description: "Embed Grafana dashboards", categoryId: "marketplace" },
      { id: "video-clipper", label: "Video Clipper", icon: IconScissors, group: "placeholder", description: "Clip and embed videos", categoryId: "marketplace" },
      { id: "webhook-manager", label: "Webhook manager", icon: IconPlug, group: "placeholder", description: "Manage webhooks", categoryId: "marketplace" },
      { id: "wordcloud-app", label: "WordCloud.app", icon: IconWordCloud, group: "placeholder", description: "Create word clouds", categoryId: "marketplace" },
      { id: "wordle-miro", label: "Wordle for Miro", icon: IconTextT, group: "placeholder", description: "Play Wordle", categoryId: "marketplace" },
    ],
  },

  // ════════════════════════════════════════════════════════════════════════
  // OTHER
  // ════════════════════════════════════════════════════════════════════════
  {
    id: "other",
    label: "Other",
    tools: [
      { id: "flows", label: "Flows", icon: IconNodeLinesHorizontal, group: "placeholder", description: "Create user flows", categoryId: "other" },
      { id: "accessibility-checker", label: "Accessibility Checker", icon: IconAltText, group: "placeholder", description: "Check accessibility", categoryId: "other" },
      { id: "around", label: "Around", icon: IconVideoCamera, group: "placeholder", description: "Around video integration", categoryId: "other" },
      { id: "auto-layout-container", label: "Auto Layout Container", icon: IconLayout, group: "placeholder", description: "Auto-layout container", categoryId: "other" },
      { id: "autodesk-forge", label: "Autodesk Forge", icon: IconConeSerpentine, group: "placeholder", description: "Autodesk Forge integration", categoryId: "other" },
      { id: "bulk-mode", label: "Bulk mode", icon: IconPlaceholder, group: "placeholder", description: "Bulk operations mode", categoryId: "other" },
      { id: "coda-staging", label: "Coda for Miro - Staging", icon: IconArticle, group: "placeholder", description: "Coda staging integration", categoryId: "other" },
      { id: "data-labeling-v2", label: "Data Labeling V2", icon: IconTag, group: "placeholder", description: "Label data on the canvas", categoryId: "other" },
      { id: "embed-iframe", label: "Embed iFrame code", icon: IconBrowser, group: "placeholder", description: "Embed an iFrame", categoryId: "other" },
      { id: "gemini-enterprise", label: "Gemini Enterprise", icon: IconSparksFilled, group: "placeholder", description: "Google Gemini integration", categoryId: "other" },
      { id: "glean", label: "Glean", icon: IconInsightsSearch, group: "placeholder", description: "Glean knowledge search", categoryId: "other" },
      { id: "insights-tool", label: "Insights", icon: IconInsights, group: "placeholder", description: "Generate insights", categoryId: "other" },
      { id: "intelligent-qbr", label: "Intelligent QBR deck", icon: IconPresentationArrow, group: "placeholder", description: "Generate QBR decks", categoryId: "other" },
      { id: "layout-tool", label: "Layout", icon: IconLayout, group: "placeholder", description: "Auto-layout elements", categoryId: "other" },
      { id: "magic-metrics", label: "Magic Metrics", icon: IconChartNumber, group: "placeholder", description: "Auto-generate metrics", categoryId: "other" },
      { id: "magic-slides", label: "Magic Slides", icon: IconSlideFormat, group: "placeholder", description: "AI-generated slides", categoryId: "other" },
      { id: "microsoft-copilot", label: "Microsoft Copilot", icon: IconAiCursor, group: "placeholder", description: "Microsoft Copilot integration", categoryId: "other" },
      { id: "miro-digital-twin", label: "Miro Digital Twin", icon: IconCube, group: "placeholder", description: "Create digital twins", categoryId: "other" },
      { id: "miro-value-calc", label: "Miro Value Calculator", icon: IconCoins, group: "placeholder", description: "Calculate Miro value", categoryId: "other" },
      { id: "mitzu-demo", label: "Mitzu Demo", icon: IconChartBarY, group: "placeholder", description: "Mitzu analytics demo", categoryId: "other" },
      { id: "stickies-capture", label: "Stickies capture", icon: IconCamera, group: "placeholder", description: "Capture physical stickies", categoryId: "other" },
      { id: "surface-widget-sdk", label: "Surface Widget SDK", icon: IconPlug, group: "placeholder", description: "Build custom widgets", categoryId: "other" },
      { id: "team-topologies", label: "Team Topologies", icon: IconUsersThree, group: "placeholder", description: "Map team topologies", categoryId: "other" },
    ],
  },
];

/** Flat list of all overflow items — for backward compatibility and search. */
export const overflowItems: OverflowItem[] = toolCategories.flatMap((cat) => cat.tools);
