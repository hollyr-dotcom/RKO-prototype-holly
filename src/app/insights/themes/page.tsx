"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users } from "lucide-react";
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconRocket, IconThumbsUp, IconChatLinesTwo, IconBoard, IconChatTwo, IconInsights } from "@mirohq/design-system-icons";
import InsightsTopBar from "@/components/InsightsTopBar";
import { THEME_CARDS, type ThemeCard, type ThemeTag } from "@/data/themes-data";
import { ChatInput } from "@/components/toolbar/ChatInput";

// ─── Data ─────────────────────────────────────────────────────────────────────

const AI_DOCS = [
  { icon: "board", label: "Q4 ideation workshop", time: "1m" },
  { icon: "doc", label: "Product Requirement Documents", time: "1hr" },
  { icon: "board", label: "Suggestion slides", time: "1 day" },
  { icon: "board", label: "Roadmap summary slides", time: "7 days" },
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
  'What are the strongest signals this week?',
  'Which themes should we prioritise next sprint?',
  'Show me themes with the highest ARR impact',
]

const DOC_CHAT: Record<string, { response: string; prompts?: string[] }> = {
  'Q4 ideation workshop': {
    response: `Based on Miro Insights customer feedback, here are the top ways teams run effective ideation workshops:

**1. Start with a warm-up**
Customers consistently report that a 5–10 minute warm-up activity dramatically increases participation. Use a simple icebreaker board to get everyone comfortable with the canvas before diving in.

**2. Use structured templates**
Teams that start from a template — like a brainwriting grid or a How Might We board — generate 40% more ideas than those starting from a blank canvas. Miro's template library has pre-built flows for this.

**3. Time-box divergent thinking**
Set a visible timer (15–20 mins) for the ideation phase. Customers say time pressure encourages quantity over quality — exactly what you want early on. Use Miro's built-in timer widget.

**4. Vote to converge**
Use dot voting to surface the most resonant ideas quickly. Customers running workshops with 10+ participants say voting reduces group-think and gives quieter voices equal weight.

**5. Capture action items before you leave the board**
The most common regret: not turning sticky clusters into clear next steps. Assign an owner and due date to each top idea before closing the session.`,
    prompts: [
      'Which themes should we ideate on this quarter?',
      'Which signals are most urgent for Q4?',
      'How do I run a signal-to-theme mapping session?',
    ],
  },
  'Which themes should we ideate on this quarter?': {
    response: `Based on the current signal landscape, three themes are strong candidates for Q4 ideation:\n\n**Canvas Performance** — 8 signals, confidence at 84%. Three enterprise accounts have flagged it as a churn risk. It has the clearest problem statement and the most evidence behind it — good raw material for a solution-focused session.\n\n**AI UX Controls** — New signal this week. Users want inline rejection of AI suggestions without disabling the feature entirely. There's a real product design challenge here that benefits from divergent thinking.\n\n**Guest Access & Permissions** — 2 unreviewed signals, both from enterprise accounts. The constraint space is well-defined, which makes it well-suited for a constraints-led ideation format.\n\nI'd suggest running Canvas Performance and AI UX Controls in parallel breakouts, then converging on prioritisation at the end of the session.`,
    prompts: [
      'Which signals are most urgent for Q4?',
      'How do I run a signal-to-theme mapping session?',
    ],
  },
  'Which signals are most urgent for Q4?': {
    response: `**3 signals stand out for Q4** based on recency, source credibility, and business impact:\n\n**"Canvas lag when 40+ users are active on a single board"** — flagged by Spotify as a near-dealbreaker. Enterprise sales cycle peaks in Q3/Q4, which makes this time-sensitive.\n\n**"SSO enforcement not available for guest accounts"** — compliance requirement for regulated-industry accounts. Two enterprise renewals in Q4 are at risk if this isn't addressed.\n\n**"AI sticky note clustering saves facilitators 40+ minutes per session"** — this one is a positive signal. It's a feature working well that could be expanded. Ideating on where else this capability applies could be high-leverage.\n\nFor your workshop, I'd frame the first two as problem spaces and the third as an opportunity space — mixing problem-solving with opportunity-expansion tends to produce more energised sessions.`,
    prompts: [
      'Which themes should we ideate on this quarter?',
      'How do I run a signal-to-theme mapping session?',
    ],
  },
  'How do I run a signal-to-theme mapping session?': {
    response: `A signal-to-theme mapping session helps your team align on which themes are real before you ideate on solutions. Here's a format that works well:\n\n**Step 1 — Print the signals (10 mins)**\nBring the top 10–15 signals into the board as sticky notes. Include the source type and account name so participants can assess credibility.\n\n**Step 2 — Silent grouping (15 mins)**\nEach participant groups signals into clusters independently. No talking. This surfaces genuine pattern recognition vs. groupthink.\n\n**Step 3 — Name the themes (10 mins)**\nAs a group, name each cluster. If two people named the same cluster differently, that's a signal the theme boundary isn't clear yet.\n\n**Step 4 — Prioritise by impact (10 mins)**\nDot vote on which themes deserve immediate action. Weight by signals that have churn risk or revenue attached.\n\nThis format typically takes 45 minutes and produces a prioritised theme list you can hand directly to the roadmap review.`,
    prompts: [
      'Which themes should we ideate on this quarter?',
      'Which signals are most urgent for Q4?',
    ],
  },
  'Product Requirement Documents': {
    response: `Based on Miro Insights customer feedback, here's how top teams write effective PRDs on Miro:

**1. Lead with the problem, not the solution**
Customers report that PRDs which open with a clear problem statement get 2× faster sign-off. Anchor every requirement to a customer signal or a measurable outcome.

**2. Embed evidence directly in the doc**
Link sticky note clusters, Gong call clips, and theme cards inline. Reviewers are far more likely to approve requirements when the evidence is one click away.

**3. Use a consistent requirement format**
Teams that adopt a standard format — User story, Acceptance criteria, Edge cases — reduce back-and-forth with engineering by ~35% according to feedback from enterprise accounts.

**4. Version with intention**
Label every significant change. Customers say unversioned PRDs are the single biggest source of misalignment between PM and engineering at handoff.

**5. Close the loop after launch**
The best PRDs have a post-launch section. Teams that track whether shipped features matched original requirements build faster feedback loops into the next planning cycle.`,
    prompts: [
      'What makes a strong acceptance criteria?',
      'How do I link customer signals to requirements?',
      'Show me a PRD template for this theme',
    ],
  },
}

function AIPanel({ open, onClose, chatPrompt, onClearChat }: { open: boolean; onClose: () => void; chatPrompt?: string; onClearChat?: () => void }) {
  const [activeChip, setActiveChip] = useState<string | null>(null)

  const activePrompt = activeChip ?? chatPrompt

  if (!open) return null

  return (
    <motion.aside
      initial={{ x: 40, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 40, opacity: 0 }}
      transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
      className="fixed top-4 right-4 bottom-4 w-[472px] bg-white rounded-[20px] shadow-[0_0_12px_rgba(34,36,40,0.04),-2px_0_8px_rgba(34,36,40,0.12)] flex flex-col overflow-hidden z-30"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-6 py-6 border-b border-[#e0e2e8] bg-white z-10">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#E7E7E5' }}
          >
            <span className="text-[#222428] leading-[0] flex items-center justify-center">
              <IconSparksFilled css={{ width: 16, height: 16 }} />
            </span>
          </div>
          <p className="text-[#222428] text-[18px] font-heading font-medium" style={{ fontFamily: 'Roobert, sans-serif' }}>
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
      <div className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${activePrompt ? '' : 'justify-end'}`}>
        {activePrompt ? (
          /* ── Chat mode ── */
          <AnimatePresence mode="wait">
            <motion.div
              key={activePrompt}
              className="flex flex-col gap-6 px-4 pb-4"
            >
              {/* User message */}
              <motion.div
                className="flex justify-end"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: [0.2, 0, 0, 1] }}
              >
                <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                  <p className="text-[14px] text-[#222428]">{activePrompt}</p>
                </div>
              </motion.div>

              {/* AI response */}
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                  <span className="text-[#222428] leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 14, height: 14 }} />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {(DOC_CHAT[activePrompt]?.response ?? '').split('\n\n').map((para, i) => (
                    <motion.p
                      key={i}
                      className="text-[14px] text-[#222428] leading-[1.6]"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + i * 0.08, ease: [0.2, 0, 0, 1] }}
                    >
                      {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                        j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                      )}
                    </motion.p>
                  ))}
                  {DOC_CHAT[activePrompt]?.prompts && (
                    <motion.div
                      className="flex flex-col gap-2 mt-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + (DOC_CHAT[activePrompt]?.response ?? '').split('\n\n').length * 0.08 + 0.05, ease: [0.2, 0, 0, 1] }}
                    >
                      <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
                        {DOC_CHAT[activePrompt]!.prompts!.map((chip) => (
                          <button
                            key={chip}
                            onClick={() => setActiveChip(chip)}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="text-gray-400 flex-shrink-0 leading-[0]">
                              <IconSparksFilled css={{ width: 16, height: 16 }} />
                            </span>
                            <span className="text-gray-900">{chip}</span>
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                  <motion.button
                    onClick={() => { setActiveChip(null); onClearChat?.(); }}
                    className="self-start mt-2 h-8 px-3 rounded-lg text-sm font-medium text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#2B2D33] hover:text-white hover:border-[#2B2D33] transition-colors"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + (DOC_CHAT[activePrompt]?.response ?? '').split('\n\n').length * 0.08 + 0.2, ease: [0.2, 0, 0, 1] }}
                  >
                    Go to overview
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          </AnimatePresence>
        ) : (
          /* ── Default mode ── */
          <div className="flex flex-col gap-6 px-4">

            {/* Welcome + description */}
            <div className="flex flex-col gap-2">
              <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">
                Hi, Kajsa
              </p>
              <div className="text-[#656b81] text-[16px] leading-[1.5]">
                <p>
                  Since last time: 7 new themes have emerged from customer calls and market signals.
                  The Jira custom fields theme has strengthened to 99% confidence, and two urgent
                  themes around enterprise security and async video have moved up in priority.
                </p>
                <p className="mt-4">
                  Three themes are weakening and may be ready to archive. One new theme — real-time
                  translation — is gaining momentum in APAC and LATAM. Ready to dig in?
                </p>
              </div>
            </div>

            {/* Prompt chips */}
            <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="text-gray-400 flex-shrink-0 leading-[0]">
                    <IconSparksFilled css={{ width: 16, height: 16 }} />
                  </span>
                  <span className="text-gray-900">{chip}</span>
                </button>
              ))}
            </div>

          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-6 pb-6 pt-4 shrink-0">
        <ChatInput onSubmit={() => {}} />
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
  return <IconThumbsUp css={{ width: 14, height: 14 }} />;
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
  Urgent: "#FFABEC",
  Customer: "#FFED7B",
  Market: "#A0C4FB",
  Strengthening: "#FFBD83",
  Weakening: "#B5A9FF",
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
      className="relative flex flex-col items-start p-4 rounded-[24px] transition-all text-left shadow-sm hover:shadow-md duration-200 cursor-pointer"
      style={{
        backgroundColor: active ? TAG_ACTIVE_COLORS[label] ?? "#3859FF" : "white",
      }}
    >
      <p className="text-sm mb-1" style={{ color: active ? (label === "All" ? "rgba(255,255,255,0.7)" : "#222428") : "#656b81", opacity: active && label !== "All" ? 0.6 : 1 }}>{label}</p>
      <p className="text-2xl font-serif" style={{ color: active && label === "All" ? "white" : "#222428" }}>{count}</p>
    </button>
  );
}

function ThemeCardItem({ card, index, aiOpen }: { card: ThemeCard; index: number; aiOpen?: boolean }) {
  const router = useRouter();
  const navigateToDetail = () => router.push(`/insights/themes/${card.id}`);
  const [hovered, setHovered] = useState(false);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.07, ease: [0.2, 0, 0, 1] }}
      onClick={navigateToDetail}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-[24px] shadow-sm cursor-pointer"
      style={{ backgroundColor: '#E7E7E5', padding: '2px 2px 6px 2px' }}
    >
      <div className="rounded-[24px] p-6 bg-white flex gap-4 h-full">
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
                backgroundColor: tag.label === "New" ? "#DBFAAD" : tag.label === "Customer" ? "#FFED7B" : tag.label === "Market" ? "#A0C4FB" : tag.label === "Urgent" ? "#FFABEC" : tag.label === "Strengthening" ? "#FFBD83" : tag.label === "Weakening" ? "#B5A9FF" : "white",
                borderColor: tag.label === "New" ? "#DBFAAD" : tag.label === "Customer" ? "#FFED7B" : tag.label === "Market" ? "#A0C4FB" : tag.label === "Urgent" ? "#FFABEC" : tag.label === "Strengthening" ? "#FFBD83" : tag.label === "Weakening" ? "#B5A9FF" : "#e0e2e8",
              }}
            >
              {tag.label === "New" ? <GiftIcon size={16} /> : tag.label === "Customer" ? <IconSmileyChat css={{ width: 16, height: 16 }} /> : tag.label === "Market" ? <IconGlobe css={{ width: 16, height: 16 }} /> : tag.label === "Urgent" ? <IconExclamationPointCircle css={{ width: 16, height: 16 }} /> : tag.label === "Strengthening" ? <IconChartLine css={{ width: 16, height: 16 }} /> : tag.label === "Weakening" ? <IconArrowDown css={{ width: 16, height: 16 }} /> : <BoardIcon size={12} />}
              {tag.label}
            </span>
          ))}
        </div>

        {/* Title */}
        <p className="text-lg font-heading font-medium text-gray-900 leading-snug mb-1">
          {card.title}
        </p>

        {/* Subheader — always visible */}
        <p className="text-sm text-[#656b81] leading-[1.4] line-clamp-2">{card.description}</p>

        {/* Expandable content — meta, actions */}
        <AnimatePresence initial={false}>
          {hovered && (
            <motion.div
              key="expanded"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.2, 0, 0, 1] }}
              className="overflow-hidden flex flex-col gap-2.5"
            >
              {/* Meta row */}
              <div className="flex items-center gap-2 flex-wrap my-2">
                <div className="flex items-center gap-1 h-7 px-2 rounded-[6px] text-[14px] text-[#222428]" style={{ backgroundColor: '#e9eaef' }}>
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

            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions — always visible */}
        <div className="flex items-center gap-2 mt-0.5">
          <button
            onClick={(e) => e.stopPropagation()}
            className={`${aiOpen ? 'min-h-8 h-auto py-1.5' : 'h-8'} px-3 rounded-lg text-sm font-medium transition-colors ${
              card.primaryAction.variant === "outline"
                ? "border border-[#e0e2e8] text-[#222428] bg-white hover:bg-[#222428] hover:text-white hover:border-[#222428]"
                : ""
            }`}
            style={
              card.primaryAction.variant === "filled"
                ? { backgroundColor: "#222428", color: "white" }
                : undefined
            }
          >
            {card.primaryAction.label}
          </button>
          {card.secondaryAction && (
            <button
              onClick={(e) => { e.stopPropagation(); navigateToDetail(); }}
              className={`${aiOpen ? 'min-h-8 h-auto py-1.5' : 'h-8'} px-3 rounded-lg text-sm text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#2B2D33] hover:text-white hover:border-[#2B2D33] transition-colors`}
            >
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
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemesPage() {
  const [filters, setFilters] = useState(CATEGORY_FILTERS);
  const [aiOpen, setAiOpen] = useState(false);
  const [aiChatPrompt, setAiChatPrompt] = useState<string | undefined>(undefined);

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
        activeLabels.every((label) => card.tags.some((tag) => tag.label === label))
      );

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />
      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 488 : 0, transition: 'padding-right 0.25s ease' }}
      >
      <main className="px-0 py-[60px] mx-[60px]">

        {/* ── Heading ── */}
        <div className="flex items-center justify-between mb-[60px]">
          <div>
            <h1 id="themes-heading" className="text-[60px] font-serif text-[#222428]">Themes</h1>
          </div>
          <p className="text-[20px] text-[#222428]/70 max-w-sm leading-relaxed text-right">
            Discover emerging trends and potential disruptions, plus important updates
          </p>
        </div>

        {/* ── Section header ── */}
        <div className="flex items-center justify-between sticky top-0 z-20 pt-4 pb-5" style={{ backgroundColor: '#FBFAF7' }}>
          <div className="flex items-center gap-2">
            <h2
              className="text-[24px] font-serif text-[#222428]"
            >
              Results
            </h2>
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
              className="rounded-[24px] p-4 bg-white shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold text-[#222428]">AI generated</p>
                <p className="text-xs text-[#656b81]">Ready to share</p>
              </div>
              <div className="flex flex-col gap-1">
                {AI_DOCS.map((doc) => (
                  <button
                    key={doc.label}
                    onClick={() => { setAiOpen(true); setAiChatPrompt(doc.label); }}
                    className="flex items-center gap-2 h-10 px-1 rounded-lg hover:bg-[#E7E7E5] transition-colors text-left w-full"
                  >
                    <span className="text-[#656b81] shrink-0">
                      {doc.icon === "doc" ? <DocIcon size={16} /> : <IconBoard css={{ width: 16, height: 16 }} />}
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
              <ThemeCardItem key={card.id} card={card} index={i} aiOpen={aiOpen} />
            ))}
          </div>

        </div>
      </main>
      </div>

      {/* Floating input bar */}
      {!aiOpen && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-20" style={{ width: 560 }}>
          <div
            className="bg-white rounded-full"
            style={{ padding: 6, boxShadow: '0px 6px 16px 0px rgba(34,36,40,0.12), 0px 0px 8px 0px rgba(34,36,40,0.06)' }}
          >
            <ChatInput onSubmit={() => setAiOpen(true)} onOpenChat={() => setAiOpen(true)} onFocusChange={(focused) => { if (focused) setAiOpen(true) }} />
          </div>
        </div>
      )}

      {/* AI panel */}
      <AIPanel open={aiOpen} onClose={() => { setAiOpen(false); setAiChatPrompt(undefined); }} chatPrompt={aiChatPrompt} onClearChat={() => setAiChatPrompt(undefined)} />

    </div>
  );
}
