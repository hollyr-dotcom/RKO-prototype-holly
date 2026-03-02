"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Users } from "lucide-react";
import { IconSparksFilled, IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconDollarSignCurrency, IconRocket, IconThumbsUp, IconChatLinesTwo, IconBoard } from "@mirohq/design-system-icons";
import InsightsTopBar from "@/components/InsightsTopBar";
import { THEME_CARDS, type ThemeCard, type ThemeTag } from "@/data/themes-data";

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
      <div className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${chatPrompt ? '' : 'justify-end'}`}>
        {chatPrompt ? (
          /* ── Chat mode ── */
          <AnimatePresence mode="wait">
            <motion.div
              key={chatPrompt}
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
                  <p className="text-[14px] text-[#222428]">{chatPrompt}</p>
                </div>
              </motion.div>

              {/* AI response */}
              <motion.div
                className="flex items-start gap-3"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.2, ease: [0.2, 0, 0, 1] }}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#3859FF' }}>
                  <span className="text-white leading-[0] flex items-center justify-center">
                    <IconSparksFilled css={{ width: 14, height: 14 }} />
                  </span>
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  {(DOC_CHAT[chatPrompt ?? '']?.response ?? '').split('\n\n').map((para, i) => (
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
                  {DOC_CHAT[chatPrompt ?? '']?.prompts && (
                    <motion.div
                      className="flex flex-col gap-2 mt-2"
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.35 + (DOC_CHAT[chatPrompt ?? '']?.response ?? '').split('\n\n').length * 0.08 + 0.05, ease: [0.2, 0, 0, 1] }}
                    >
                      {DOC_CHAT[chatPrompt ?? '']!.prompts!.map((chip) => (
                        <button
                          key={chip}
                          className="flex items-center gap-1.5 h-8 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[13px] text-[#222428] hover:bg-[#f1f2f5] transition-colors text-left w-fit"
                        >
                          <span className="shrink-0 leading-[0] flex items-center justify-center opacity-70">
                            <IconSparksFilled css={{ width: 14, height: 14 }} />
                          </span>
                          <span className="pr-1">{chip}</span>
                        </button>
                      ))}
                    </motion.div>
                  )}
                  <motion.button
                    onClick={onClearChat}
                    className="self-start mt-2 h-8 px-3 rounded-lg text-sm font-medium text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#2B2D33] hover:text-white hover:border-[#2B2D33] transition-colors"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + (DOC_CHAT[chatPrompt ?? '']?.response ?? '').split('\n\n').length * 0.08 + 0.2, ease: [0.2, 0, 0, 1] }}
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
            <div className="flex flex-col gap-3">
              {PROMPT_CHIPS.map((chip) => (
                <button
                  key={chip}
                  className="flex items-start gap-1 min-h-8 py-1.5 pl-3 pr-2 border border-[#e0e2e8] rounded-[8px] bg-white text-[14px] text-[#222428] hover:bg-[#C6DCFF] transition-colors text-left w-fit"
                >
                  <span className="shrink-0 opacity-70 leading-[0] flex items-center justify-center mt-0.5">
                    <IconSparksFilled css={{ width: 16, height: 16 }} />
                  </span>
                  <span className="pr-1">{chip}</span>
                </button>
              ))}
            </div>

          </div>
        )}
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
      className="relative flex flex-col items-start p-4 rounded-xl transition-all text-left shadow-sm hover:shadow-md duration-200 cursor-pointer"
      style={{
        backgroundColor: active ? TAG_ACTIVE_COLORS[label] ?? "#3859FF" : "white",
      }}
    >
      <p className="text-sm mb-1" style={{ color: active ? (label === "All" ? "rgba(255,255,255,0.7)" : "#222428") : "#656b81", opacity: active && label !== "All" ? 0.6 : 1 }}>{label}</p>
      <p className="text-2xl font-serif" style={{ color: active && label === "All" ? "white" : "#222428" }}>{count}</p>
    </button>
  );
}

function ThemeCardItem({ card, index }: { card: ThemeCard; index: number }) {
  const router = useRouter();
  const navigateToDetail = () => router.push(`/insights/themes/${card.id}`);
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 + index * 0.07, ease: [0.2, 0, 0, 1] }}
      onClick={navigateToDetail}
      className="rounded-xl p-6 bg-white flex gap-4 shadow-sm hover:shadow-md transition-shadow duration-200 cursor-pointer"
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
            onClick={(e) => e.stopPropagation()}
            className={`h-8 px-3 rounded-lg text-sm font-medium transition-colors ${
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
              className="h-8 px-3 rounded-lg text-sm text-[#222428] border border-[#e0e2e8] bg-white hover:bg-[#2B2D33] hover:text-white hover:border-[#2B2D33] transition-colors"
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
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ThemesPage() {
  const [filters, setFilters] = useState(CATEGORY_FILTERS);
  const [aiOpen, setAiOpen] = useState(true);
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
          style={{ backgroundColor: '#2A2A2D' }}
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
              className="rounded-xl p-4 bg-white shadow-sm"
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
              <ThemeCardItem key={card.id} card={card} index={i} />
            ))}
          </div>

        </div>
      </main>
      </div>

      {/* AI panel */}
      <AIPanel open={aiOpen} onClose={() => { setAiOpen(false); setAiChatPrompt(undefined); }} chatPrompt={aiChatPrompt} onClearChat={() => setAiChatPrompt(undefined)} />

    </div>
  );
}
