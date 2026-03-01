"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Bell, Users } from "lucide-react";
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconDollarSignCurrency, IconRocket, IconThumbsUp, IconChatLinesTwo } from "@mirohq/design-system-icons";
import InsightsTopBar from "@/components/InsightsTopBar";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AI_DOCS = [
  { icon: "board", label: "Q4 ideation workshop", time: "1m" },
  { icon: "doc", label: "Product Requirement Documents", time: "1hr" },
  { icon: "board", label: "Suggestion slides", time: "1 day" },
  { icon: "board", label: "Roadmap summary slides", time: "7 days" },
];

type ThemeTag = { label: string };

type ThemeCard = {
  id: string;
  image?: string;
  tags: ThemeTag[];
  title: string;
  description: string;
  meta: {
    sources: number;
    arr: string;
    confidence: string;
    confidenceDelta: string;
    likes: number;
    comments?: number;
  };
  primaryAction: { label: string; variant: "filled" | "outline" };
  secondaryAction?: { label: string };
};

const THEME_CARDS: ThemeCard[] = [
  {
    id: "1",
    tags: [{ label: "New" }, { label: "Customer" }, { label: "Market" }],
    title: "Jira custom fields demand surged +65% this quarter",
    description:
      "Time-sensitive — competitor gap is closing. Demand accelerating while the window for differentiation narrows.",
    meta: {
      sources: 0,
      arr: "$2.3 Million ARR",
      confidence: "99%",
      confidenceDelta: "+1%",
      likes: 1,
      comments: 1,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "2",
    tags: [{ label: "New" }, { label: "Customer" }],
    title: "Adoption plateau signals mismatch between vision and usage",
    description:
      "Suggestion created: Re-align roadmap to actual usage patterns and double down on the feature with proven revenue lift, rather than continuing to fund lower-impact bets.",
    meta: {
      sources: 0,
      arr: "$2.3 Million ARR",
      confidence: "88%",
      confidenceDelta: "+1%",
      likes: 3,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "3",
    tags: [{ label: "New" }, { label: "Customer" }],
    title:
      "3 enterprise accounts mentioned \"portfolio view\" — wasn't in your top 20",
    description:
      "Feature adoption dropped below 5% threshold — silent abandonment",
    meta: {
      sources: 1,
      arr: "$2.3 Million ARR",
      confidence: "80%",
      confidenceDelta: "+5%",
      likes: 1,
      comments: 1,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "4",
    tags: [{ label: "Urgent" }, { label: "Customer" }, { label: "Market" }],
    title: "AI sticky note clustering saves facilitators 40+ minutes per session",
    description:
      "Users running retrospectives and workshops report AI summarisation as the single biggest time-saver. Competitor parity risk — Figma FigJam shipped a similar feature last sprint.",
    meta: {
      sources: 3,
      arr: "$4.1 Million ARR",
      confidence: "94%",
      confidenceDelta: "+3%",
      likes: 7,
      comments: 3,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "5",
    tags: [{ label: "Strengthening" }, { label: "Customer" }],
    title: "Real-time cursor lag on boards with 50+ objects drives session abandonment",
    description:
      "Performance degradation consistently cited in enterprise churn interviews. 12 accounts flagged canvas lag as a blocker to wider team rollout.",
    meta: {
      sources: 2,
      arr: "$3.6 Million ARR",
      confidence: "91%",
      confidenceDelta: "+2%",
      likes: 5,
      comments: 2,
    },
    primaryAction: { label: "File bug report", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "6",
    tags: [{ label: "New" }, { label: "Market" }],
    title: "Template library depth is a top-3 purchase criteria for mid-market buyers",
    description:
      "Sales call analysis shows prospects comparing template counts directly against Lucidspark and Conceptboard. Current gap: 340 vs 600+ competitor templates.",
    meta: {
      sources: 4,
      arr: "$1.8 Million ARR",
      confidence: "76%",
      confidenceDelta: "+8%",
      likes: 4,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "7",
    tags: [{ label: "Weakening" }, { label: "Customer" }],
    title: "Mobile editing experience cited in 18% of negative NPS responses",
    description:
      "Touch target sizing and zoom behaviour on iOS prevent meaningful contribution from mobile. Signal weakening as desktop-first habits persist post-pandemic.",
    meta: {
      sources: 0,
      arr: "$0.9 Million ARR",
      confidence: "72%",
      confidenceDelta: "-2%",
      likes: 2,
      comments: 1,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "8",
    tags: [{ label: "Urgent" }, { label: "Customer" }],
    title: "Async video comments reduce meeting load — users want it on every object",
    description:
      "Teams using Loom embeds report 30% fewer sync meetings. Demand to expand native async video to shapes, connectors, and frames — not just sticky notes.",
    meta: {
      sources: 2,
      arr: "$2.7 Million ARR",
      confidence: "88%",
      confidenceDelta: "+4%",
      likes: 9,
      comments: 5,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "9",
    tags: [{ label: "Customer" }, { label: "Strengthening" }],
    title: "Smart shape suggestions during diagramming cut creation time by half",
    description:
      "Users building flowcharts and org charts want AI to auto-suggest the next shape based on context. Early beta testers show 2x faster diagram completion rates.",
    meta: {
      sources: 3,
      arr: "$3.2 Million ARR",
      confidence: "86%",
      confidenceDelta: "+6%",
      likes: 11,
      comments: 4,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "10",
    tags: [{ label: "New" }, { label: "Customer" }],
    title: "Guest access limitations blocking external contractor collaboration",
    description:
      "Freelancers and agency partners can't edit specific sections without full workspace access. 23 enterprise accounts raised this as a blocker to wider rollout.",
    meta: {
      sources: 2,
      arr: "$1.9 Million ARR",
      confidence: "83%",
      confidenceDelta: "+3%",
      likes: 6,
      comments: 2,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "11",
    tags: [{ label: "Urgent" }, { label: "Market" }],
    title: "Presentation mode lacking speaker notes drives users back to PowerPoint",
    description:
      "Product managers and designers need speaker notes during live walkthroughs. 40% of users who churn back to slide tools cite this gap as their primary reason.",
    meta: {
      sources: 4,
      arr: "$4.5 Million ARR",
      confidence: "92%",
      confidenceDelta: "+2%",
      likes: 14,
      comments: 7,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "12",
    tags: [{ label: "Customer" }, { label: "Strengthening" }],
    title: "Cross-board search returning incomplete results frustrates power users",
    description:
      "Enterprise teams with 500+ boards report search missing sticky notes and embedded content. Confidence in search has dropped — users resort to manual browsing.",
    meta: {
      sources: 1,
      arr: "$2.1 Million ARR",
      confidence: "79%",
      confidenceDelta: "+1%",
      likes: 5,
      comments: 3,
    },
    primaryAction: { label: "File bug report", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "13",
    tags: [{ label: "New" }, { label: "Customer" }, { label: "Market" }],
    title: "Unlimited undo history is now table stakes — 50-step limit causes friction",
    description:
      "Figma and Notion both offer deep undo history. Users running long workshops hit the limit mid-session and lose significant work, driving negative NPS responses.",
    meta: {
      sources: 3,
      arr: "$1.4 Million ARR",
      confidence: "81%",
      confidenceDelta: "+4%",
      likes: 8,
      comments: 2,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "14",
    tags: [{ label: "Strengthening" }, { label: "Customer" }],
    title: "Nested frames enable structured content — demand up 55% from design teams",
    description:
      "Design and product teams use nested frames to represent component hierarchies and page layouts. Current flat frame model forces workarounds with grouped shapes.",
    meta: {
      sources: 2,
      arr: "$2.8 Million ARR",
      confidence: "85%",
      confidenceDelta: "+7%",
      likes: 10,
      comments: 4,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "15",
    tags: [{ label: "New" }, { label: "Market" }],
    title: "Custom brand colour palettes per workspace requested by 60% of agencies",
    description:
      "Creative agencies need to lock workspace colours to client brand guidelines. Current workaround of saving hex codes in a sticky note is cited as unprofessional in pitches.",
    meta: {
      sources: 2,
      arr: "$1.7 Million ARR",
      confidence: "77%",
      confidenceDelta: "+3%",
      likes: 7,
      comments: 1,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "16",
    tags: [{ label: "Weakening" }, { label: "Customer" }],
    title: "Comment threading diluted by lack of resolution states",
    description:
      "Design review comments pile up with no way to mark them resolved or assign follow-ups. Signal weakening as teams migrate feedback workflows to Linear and Notion.",
    meta: {
      sources: 1,
      arr: "$0.8 Million ARR",
      confidence: "68%",
      confidenceDelta: "-3%",
      likes: 3,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "17",
    tags: [{ label: "Urgent" }, { label: "Customer" }, { label: "Market" }],
    title: "Notion integration tops third-party request list for two consecutive quarters",
    description:
      "Product and engineering teams want to embed live Notion pages in boards and push Miro frames as Notion documents. Zapier workarounds add 20+ minutes to weekly rituals.",
    meta: {
      sources: 5,
      arr: "$5.1 Million ARR",
      confidence: "96%",
      confidenceDelta: "+2%",
      likes: 18,
      comments: 9,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "18",
    tags: [{ label: "New" }, { label: "Customer" }],
    title: "Whiteboard session recording unlocks async review for distributed teams",
    description:
      "Remote-first teams want to record facilitated sessions with cursor playback for members in different time zones. Competitors Mural and FigJam both ship this in Q3.",
    meta: {
      sources: 3,
      arr: "$3.0 Million ARR",
      confidence: "84%",
      confidenceDelta: "+5%",
      likes: 12,
      comments: 6,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "19",
    tags: [{ label: "Strengthening" }, { label: "Market" }],
    title: "Advanced table widget closing the gap with Airtable for lightweight data tasks",
    description:
      "Users managing sprint trackers and OKR tables inside Miro want sorting, filtering, and formula support. Signal strengthening as Miro becomes the single source of truth for more teams.",
    meta: {
      sources: 2,
      arr: "$2.4 Million ARR",
      confidence: "80%",
      confidenceDelta: "+5%",
      likes: 8,
      comments: 3,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "20",
    tags: [{ label: "New" }, { label: "Customer" }],
    title: "AI meeting facilitation reduces facilitator prep time by 60%",
    description:
      "Teams want AI to auto-generate agendas, timers, and icebreakers based on meeting type. Early interest strongest in HR and L&D personas running large-scale workshops.",
    meta: {
      sources: 2,
      arr: "$3.8 Million ARR",
      confidence: "78%",
      confidenceDelta: "+9%",
      likes: 13,
      comments: 5,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "21",
    tags: [{ label: "Weakening" }, { label: "Customer" }],
    title: "Keyboard shortcut discoverability below industry standard",
    description:
      "Power users report Miro's shortcut coverage is comprehensive but invisible. Requests for a command palette (Cmd+K) have plateaued — signal weakening as habit forms around mouse-only workflows.",
    meta: {
      sources: 0,
      arr: "$0.5 Million ARR",
      confidence: "65%",
      confidenceDelta: "-1%",
      likes: 2,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "22",
    tags: [{ label: "Urgent" }, { label: "Customer" }],
    title: "Board loading time exceeds 8 seconds for teams with embedded media",
    description:
      "Boards containing video embeds, large PDFs, and Figma frames take 8–15 seconds to load. Five enterprise accounts have opened support tickets flagging this as a retention risk.",
    meta: {
      sources: 3,
      arr: "$3.3 Million ARR",
      confidence: "93%",
      confidenceDelta: "+1%",
      likes: 6,
      comments: 4,
    },
    primaryAction: { label: "File bug report", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "23",
    tags: [{ label: "New" }, { label: "Market" }],
    title: "Custom fonts support is a hard blocker for brand-conscious enterprise buyers",
    description:
      "Legal, financial, and pharmaceutical enterprises require specific typefaces for compliance. Three six-figure deals stalled at procurement due to absence of custom font upload.",
    meta: {
      sources: 2,
      arr: "$6.2 Million ARR",
      confidence: "89%",
      confidenceDelta: "+4%",
      likes: 15,
      comments: 3,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "24",
    tags: [{ label: "Strengthening" }, { label: "Customer" }, { label: "Market" }],
    title: "WCAG AA compliance gaps affecting public sector and education deals",
    description:
      "Screen reader support and keyboard navigation fall short of WCAG AA standards. EU accessibility legislation effective 2025 is accelerating urgency across 14 enterprise accounts.",
    meta: {
      sources: 4,
      arr: "$4.7 Million ARR",
      confidence: "91%",
      confidenceDelta: "+6%",
      likes: 10,
      comments: 5,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "25",
    tags: [{ label: "Customer" }, { label: "Strengthening" }],
    title: "Offline mode for field teams unlocks manufacturing and healthcare use cases",
    description:
      "Field engineers and clinical teams operate in connectivity-limited environments. Offline board access with sync-on-reconnect would open two entirely new market verticals.",
    meta: {
      sources: 2,
      arr: "$2.9 Million ARR",
      confidence: "74%",
      confidenceDelta: "+3%",
      likes: 7,
      comments: 2,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "26",
    tags: [{ label: "New" }, { label: "Customer" }],
    title: "Live voting and polling in sticky note clusters accelerates consensus",
    description:
      "Facilitators running dot-voting sessions use workarounds with emoji reactions. Native polling with real-time result visualisation is the top request from agile coaches.",
    meta: {
      sources: 2,
      arr: "$1.6 Million ARR",
      confidence: "82%",
      confidenceDelta: "+4%",
      likes: 9,
      comments: 3,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "27",
    tags: [{ label: "Urgent" }, { label: "Market" }],
    title: "Miro's pricing jump at 10 seats is causing mid-market churn to Lucidspark",
    description:
      "Teams of 8–15 report sticker shock when crossing the 10-seat threshold. Competitor analysis shows Lucidspark's flat-rate plan captures 34% of churned Miro mid-market accounts.",
    meta: {
      sources: 5,
      arr: "$7.4 Million ARR",
      confidence: "95%",
      confidenceDelta: "+2%",
      likes: 20,
      comments: 11,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "28",
    tags: [{ label: "New" }, { label: "Customer" }, { label: "Market" }],
    title: "Real-time translation for global teams removes language as a collaboration barrier",
    description:
      "Multinational enterprises with non-English-speaking stakeholders want sticky note and comment auto-translation. Signal emerging strongly from APAC and LATAM expansion cohorts.",
    meta: {
      sources: 2,
      arr: "$2.2 Million ARR",
      confidence: "71%",
      confidenceDelta: "+8%",
      likes: 11,
      comments: 4,
    },
    primaryAction: { label: "Edit roadmap", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
  {
    id: "29",
    tags: [{ label: "Weakening" }, { label: "Customer" }],
    title: "Mind map mode adoption plateauing as Miro users default to sticky notes",
    description:
      "Mind map feature usage has flatlined at 8% MAU after initial spike. Users prefer freeform sticky note layouts over structured mind map constraints.",
    meta: {
      sources: 1,
      arr: "$0.6 Million ARR",
      confidence: "63%",
      confidenceDelta: "-4%",
      likes: 2,
      comments: 1,
    },
    primaryAction: { label: "View details", variant: "outline" },
  },
  {
    id: "30",
    tags: [{ label: "Strengthening" }, { label: "Customer" }],
    title: "Sprint planning templates driving 3x retention in engineering teams",
    description:
      "Engineering teams who use the sprint planning template during onboarding show 3x 90-day retention vs. those who start with a blank board. Signal strengthening with each new template added.",
    meta: {
      sources: 3,
      arr: "$4.0 Million ARR",
      confidence: "90%",
      confidenceDelta: "+5%",
      likes: 16,
      comments: 6,
    },
    primaryAction: { label: "Move to \"Next\"", variant: "filled" },
    secondaryAction: { label: "View details" },
  },
];

const TAG_COUNTS = Object.fromEntries(
  ["New", "Urgent", "Customer", "Market", "Strengthening", "Weakening"].map((label) => [
    label,
    THEME_CARDS.filter((card) => card.tags.some((t) => t.label === label)).length,
  ])
);

const CATEGORY_FILTERS = [
  { label: "All", count: THEME_CARDS.length, active: true },
  { label: "New", count: TAG_COUNTS["New"], active: false },
  { label: "Urgent", count: TAG_COUNTS["Urgent"], active: false },
  { label: "Customer", count: TAG_COUNTS["Customer"], active: false },
  { label: "Market", count: TAG_COUNTS["Market"], active: false },
  { label: "Strengthening", count: TAG_COUNTS["Strengthening"], active: false },
  { label: "Weakening", count: TAG_COUNTS["Weakening"], active: false },
];

// ─── AI Panel ─────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  'Give me a more detailed update',
  'Tell me about items in triage',
  'Add triage items to ideas',
]

function AIPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [input, setInput] = useState('')

  if (!open) return null

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[400px] bg-white rounded-[20px] shadow-[0_0_12px_rgba(34,36,40,0.04),-2px_0_8px_rgba(34,36,40,0.12)] flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 border-b border-[#e0e2e8] bg-white z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#3859FF' }}
          >
            <span className="text-white leading-[0] flex items-center justify-center">
              <IconSparksFilled css={{ width: 16, height: 16 }} />
            </span>
          </div>
          <p className="text-[#222428] text-base font-semibold" style={{ fontFamily: 'Roobert, sans-serif' }}>
            Insights Assistant
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-end px-6 pb-0 pt-24">
        <div className="flex flex-col gap-6 px-4">

          {/* Agent avatar pill */}
          <div className="flex items-start">
            <div className="flex items-center gap-1 bg-[#C6DCFF] rounded-full pr-2">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: '#3859FF' }}
              >
                <span className="text-white leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 16, height: 16 }} />
                </span>
              </div>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6L8 10L12 6" stroke="#222428" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </div>

          {/* Welcome + description */}
          <div className="flex flex-col gap-2">
            <p className="text-[#222428] text-[20px] font-semibold leading-[1.4]" style={{ fontFamily: 'Roobert, sans-serif' }}>
              Welcome back, Kajsa
            </p>
            <div className="text-[#222428] text-[16px] leading-[1.5]">
              <p>
                Since last time: a comprehensive review of &lsquo;Fiesta Insights&rsquo; was conducted to
                identify competitor strategies. An in-depth analysis of user feedback on party
                preferences and emerging trends was also performed. These insights have been
                synthesized to enhance the Invites roadmap, ensuring alignment with user
                expectations and market dynamics.
              </p>
              <p className="mt-4">
                There are two items in triage, ready for review. What&apos;s the plan?
              </p>
            </div>
          </div>

          {/* Prompt chips */}
          <div className="flex flex-col gap-3">
            {PROMPT_CHIPS.map((chip) => (
              <button
                key={chip}
                className="flex items-center gap-1 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[14px] text-[#222428] hover:bg-[#C6DCFF] transition-colors text-left w-fit"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 opacity-70">
                  <rect x="3" y="2" width="10" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
                  <path d="M5.5 5.5h5M5.5 8h5M5.5 10.5h3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                </svg>
                <span className="pr-1">{chip}</span>
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-6 shrink-0">
        <div className="border border-[#e0e2e8] rounded-[8px] overflow-hidden">
          <div className="px-4 pt-4 pb-6">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="What can I do next?"
              className="w-full text-[14px] text-[#222428] placeholder-[#7d8297] bg-transparent outline-none"
            />
          </div>
          <div className="flex items-center justify-between px-2 py-2">
            <div className="flex items-center">
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#C6DCFF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#C6DCFF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="6.5" cy="6.5" r="3.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
              <button className="w-8 h-8 flex items-center justify-center rounded text-[#656b81] hover:bg-[#C6DCFF] transition-colors">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2.5 4h11M2.5 8h11M2.5 12h11" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                  <circle cx="5.5" cy="4" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="10.5" cy="8" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                  <circle cx="5.5" cy="12" r="1.5" fill="white" stroke="currentColor" strokeWidth="1.3" />
                </svg>
              </button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded bg-[#e9eaef] text-[#656b81]">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 12V4M4 8l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </motion.aside>
  )
}

// ─── Icons ────────────────────────────────────────────────────────────────────


function GiftIcon({ size = 12 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 7h14v2H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7V15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 7C8 7 6 5.5 5.5 4.5C5 3.5 5.5 2 7 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7C8 7 10 5.5 10.5 4.5C11 3.5 10.5 2 9 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function BoardIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

function DocIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
      <rect x="2" y="1" width="10" height="14" rx="1.5" stroke="currentColor" strokeWidth="1.2" />
      <path d="M5 5h6M5 8h6M5 11h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <circle cx="8" cy="8" r="5.5" stroke="#656b81" strokeWidth="1.4" />
      <path d="M12.5 12.5L15.5 15.5" stroke="#656b81" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M2 4h14M5 9h8M7.5 14h3" stroke="#656b81" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function InfoIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="6.5" stroke="#aeb2c0" strokeWidth="1.2" />
      <path d="M8 5.5v.5M8 7.5v4" stroke="#aeb2c0" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M3 5l4 4 4-4" stroke="#222428" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ThumbsUpIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M4 6.5L6 2C6 2 7 2 7 3.5V5.5H11.5L10.5 10H4V6.5Z" stroke="#656b81" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M4 6H2.5V10H4" stroke="#656b81" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 2h10a1 1 0 011 1v6a1 1 0 01-1 1H8l-3 2v-2H2a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="#656b81" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M4 2h8a1 1 0 011 1v10l-5-3-5 3V3a1 1 0 011-1z" stroke="#656b81" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  );
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="4" r="1" fill="#656b81" />
      <circle cx="8" cy="8" r="1" fill="#656b81" />
      <circle cx="8" cy="12" r="1" fill="#656b81" />
    </svg>
  );
}

function ConfidenceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M2 10L5 6L8 8L12 3" stroke="#656b81" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SourceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5" stroke="#656b81" strokeWidth="1.2" />
      <path d="M4 7h6M7 4v6" stroke="#656b81" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

// ─── Tag color map ────────────────────────────────────────────────────────────

const TAG_ACTIVE_COLORS: Record<string, string> = {
  All: "#222428",
  New: "#DBFAAD",
  Urgent: "#FFD8D8",
  Customer: "#DEDAFF",
  Market: "#F8D3AF",
  Strengthening: "#F5EDAB",
  Weakening: "#C6DCFF",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function CategoryCard({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="relative flex flex-col items-start p-4 rounded-xl border transition-colors text-left"
      style={{
        borderColor: active ? TAG_ACTIVE_COLORS[label] ?? "#3859FF" : "#e0e2e8",
        backgroundColor: active ? TAG_ACTIVE_COLORS[label] ?? "#3859FF" : "white",
      }}
    >
      <p className="text-sm mb-1" style={{ color: active ? (label === "All" ? "rgba(255,255,255,0.7)" : "#222428") : "#656b81", opacity: active && label !== "All" ? 0.6 : 1 }}>{label}</p>
      <p className="text-2xl font-serif" style={{ color: active && label === "All" ? "white" : "#222428" }}>{count}</p>
    </button>
  );
}

function ThemeCardItem({ card, index }: { card: ThemeCard; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.07, ease: [0.2, 0, 0, 1] }}
      className="border border-[#e0e2e8] rounded-xl p-6 bg-white flex gap-4"
    >
      {/* Thumbnail */}
      {card.image && (
        <div className="w-[120px] h-[120px] rounded-lg overflow-hidden shrink-0 bg-[#C6DCFF]">
          <img src={card.image} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-2.5">
        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.tags.map((tag) => (
            <span
              key={tag.label}
              className="flex items-center gap-1 py-2 px-3 rounded-full border text-xs text-[#222428]"
              style={{
                backgroundColor: tag.label === "New" ? "#DBFAAD" : tag.label === "Customer" ? "#DEDAFF" : tag.label === "Market" ? "#F8D3AF" : tag.label === "Urgent" ? "#FFD8D8" : tag.label === "Strengthening" ? "#F5EDAB" : tag.label === "Weakening" ? "#C6DCFF" : "white",
                borderColor: tag.label === "New" ? "#DBFAAD" : tag.label === "Customer" ? "#DEDAFF" : tag.label === "Market" ? "#F8D3AF" : tag.label === "Urgent" ? "#FFD8D8" : tag.label === "Strengthening" ? "#F5EDAB" : tag.label === "Weakening" ? "#C6DCFF" : "#e0e2e8",
              }}
            >
              {tag.label === "New" ? <GiftIcon size={16} /> : tag.label === "Customer" ? <IconSmileyChat css={{ width: 16, height: 16 }} /> : tag.label === "Market" ? <IconGlobe css={{ width: 16, height: 16 }} /> : tag.label === "Urgent" ? <IconExclamationPointCircle css={{ width: 16, height: 16 }} /> : tag.label === "Strengthening" ? <IconChartLine css={{ width: 16, height: 16 }} /> : tag.label === "Weakening" ? <IconArrowDown css={{ width: 16, height: 16 }} /> : <BoardIcon size={12} />}
              {tag.label}
            </span>
          ))}
        </div>

        {/* Title */}
        <p className="text-[24px] font-serif text-[#222428] leading-snug">
          {card.title}
        </p>

        {/* Description */}
        <p className="text-sm text-[#656b81] leading-[1.4]">{card.description}</p>

        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap my-2">
          <div className="flex items-center gap-1 h-7 px-2 rounded-[6px] text-[14px] text-[#222428]" style={{ backgroundColor: '#e9eaef' }}>
            <IconDollarSignCurrency css={{ width: 16, height: 16 }} />
            <span>{card.meta.arr}</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2 rounded-[6px] text-[14px] text-[#222428]" style={{ backgroundColor: '#e9eaef' }}>
            <IconRocket css={{ width: 16, height: 16 }} />
            <span>{card.meta.confidence}</span>
            <span className="text-[12px] text-[#656b81]">{card.meta.confidenceDelta}</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2 rounded-[6px] text-[14px] text-[#222428]" style={{ backgroundColor: '#e9eaef' }}>
            <IconThumbsUp css={{ width: 16, height: 16 }} />
            <span>{card.meta.likes}</span>
          </div>
          {card.meta.comments !== undefined && (
            <div className="flex items-center gap-1 h-7 px-2 rounded-[6px] text-[14px] text-[#222428]" style={{ backgroundColor: '#e9eaef' }}>
              <IconChatLinesTwo css={{ width: 16, height: 16 }} />
              <span>{card.meta.comments}</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            className="h-8 px-3 rounded-lg text-sm font-medium transition-colors"
            style={
              card.primaryAction.variant === "filled"
                ? { backgroundColor: "#222428", color: "white" }
                : { border: "1px solid #e0e2e8", color: "#222428", backgroundColor: "white" }
            }
          >
            {card.primaryAction.label}
          </button>
          {card.secondaryAction && (
            <button className="h-8 px-3 rounded-lg text-sm text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#C6DCFF] transition-colors">
              {card.secondaryAction.label}
            </button>
          )}
          <button className="ml-1 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#C6DCFF] transition-colors">
            <BookmarkIcon />
          </button>
          <button className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#C6DCFF] transition-colors">
            <MoreIcon />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemesPage() {
  const [filters, setFilters] = useState(CATEGORY_FILTERS);
  const [aiOpen, setAiOpen] = useState(true);

  const toggle = (label: string) => {
    if (label === "All") {
      setFilters((prev) => prev.map((f) => ({ ...f, active: f.label === "All" })));
    } else {
      setFilters((prev) => {
        const updated = prev.map((f) => {
          if (f.label === "All") return { ...f, active: false };
          if (f.label === label) return { ...f, active: !f.active };
          return f;
        });
        const anyActive = updated.some((f) => f.label !== "All" && f.active);
        return anyActive ? updated : updated.map((f) => f.label === "All" ? { ...f, active: true } : f);
      });
    }
  };

  const activeLabels = filters.filter((f) => f.active && f.label !== "All").map((f) => f.label);
  const isAllActive = filters.find((f) => f.label === "All")?.active ?? true;
  const visibleCards = isAllActive
    ? THEME_CARDS
    : THEME_CARDS.filter((card) =>
        card.tags.some((tag) => activeLabels.includes(tag.label))
      );

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar onPromptClick={() => setAiOpen(true)} />
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 400 : 0, transition: 'padding-right 0.25s ease' }}
      >
      <main className="px-0 py-[60px] mx-[60px]">

        {/* ── Dark hero section ── */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
          className="rounded-xl p-8 pt-[132px] mb-[60px] relative min-h-[440px] shadow-sm"
          style={{ backgroundColor: '#2B2D33' }}
          aria-labelledby="themes-heading"
        >
          {/* Top-right badges */}
          <div className="absolute top-4 right-4 flex items-center gap-2">
            <div className="flex items-center gap-1.5 bg-white/10 rounded-full px-3 py-1.5 border border-white/20">
              <Users className="w-3.5 h-3.5 text-white/70" />
              <span className="text-xs font-medium text-white">21</span>
            </div>
            <button
              className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-3.5 h-3.5 text-white/70" />
            </button>
            <div className="flex -space-x-2">
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-pink-400 to-rose-500 border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">A</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 border-2 border-white flex items-center justify-center">
                <span className="text-white text-[10px] font-semibold">B</span>
              </div>
            </div>
          </div>

          <div className="absolute bottom-8 left-8">
            <h1 id="themes-heading" className="text-[60px] font-serif text-white mb-3">
              Themes
            </h1>
            <p className="text-[20px] text-white/70 max-w-md leading-relaxed">
              Discover emerging trends and potential disruptions, plus important updates
            </p>
          </div>
        </motion.section>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between sticky top-0 z-20 pt-4 pb-5" style={{ backgroundColor: '#FBFAF7' }}>
          <div className="flex items-center gap-2">
            <h2
              className="text-[24px] font-serif text-[#222428]"
            >
              Themes
            </h2>
            <span className="text-sm text-[#656b81]">{visibleCards.length} results</span>
            <InfoIcon />
          </div>
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#C6DCFF] transition-colors">
              <SearchIcon />
            </button>
            <button className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-[#e0e2e8] text-sm text-[#222428] hover:bg-[#C6DCFF] transition-colors">
              Relevance
              <ChevronDownIcon />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-[#C6DCFF] transition-colors">
              <FilterIcon />
            </button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div className="flex gap-[60px]">

          {/* Left sidebar */}
          <div className="w-[300px] shrink-0 flex flex-col gap-8 sticky top-[68px] self-start">

            {/* Category filter grid */}
            <div className="grid grid-cols-2 gap-2">
              {filters.map((f) => (
                <CategoryCard
                  key={f.label}
                  label={f.label}
                  count={f.count}
                  active={f.active}
                  onClick={() => toggle(f.label)}
                />
              ))}
            </div>

            {/* AI generated panel */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}
              className="border border-[#e0e2e8] rounded-xl p-4 bg-white"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#222428]">AI generated</p>
                <p className="text-xs text-[#656b81]">Ready to share</p>
              </div>
              <div className="flex flex-col gap-1">
                {AI_DOCS.map((doc) => (
                  <button
                    key={doc.label}
                    className="flex items-center gap-2 h-8 px-1 rounded-lg hover:bg-[#C6DCFF] transition-colors text-left w-full"
                  >
                    <span className="text-[#656b81] shrink-0">
                      {doc.icon === "doc" ? <DocIcon /> : <BoardIcon />}
                    </span>
                    <span className="text-sm text-[#222428] flex-1 truncate">{doc.label}</span>
                    <span className="text-xs text-[#aeb2c0] shrink-0">{doc.time}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>

          {/* Theme cards */}
          <div className="flex-1 min-w-0 flex flex-col gap-8">
            {visibleCards.map((card, i) => (
              <ThemeCardItem key={card.id} card={card} index={i} />
            ))}
          </div>

        </div>
      </main>
      </div>

      {/* AI panel */}
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} />

      {/* Trigger to reopen */}
      {!aiOpen && (
        <button
          onClick={() => setAiOpen(true)}
          className="fixed bottom-6 right-6 w-10 h-10 rounded-full flex items-center justify-center shadow-md z-30"
          style={{ backgroundColor: '#3859FF' }}
        >
          <span className="text-white leading-[0] flex items-center justify-center">
            <IconSparksFilled css={{ width: 16, height: 16 }} />
          </span>
        </button>
      )}
    </div>
  );
}
