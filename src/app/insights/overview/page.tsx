'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Bell, Users } from 'lucide-react'
import { IconSparksFilled, IconChatTwo, IconFlag } from '@mirohq/design-system-icons'
import InsightsTopBar from '@/components/InsightsTopBar'
import { MetricCard } from '@/components/insights/MetricCard'
import { SentimentChart } from '@/components/insights/SentimentChart'
import { ThemeMatrix } from '@/components/insights/ThemeMatrix'
import { ChatInput } from '@/components/toolbar/ChatInput'

// ─── AI Panel ─────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  'Give me a more detailed update',
  'Tell me about items in triage',
  'Add triage items to ideas',
]

// Analysis data lives in SentimentChart — import the day labels for display
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const SENTIMENT_ANALYSIS = [
  `**Monday opened with new signal momentum.**\n\nNew themes emerged from customer calls and market signals — notably around early-stage UX patterns and emerging product gaps. Early confidence scores are moderate but climbing.\n\nThis is typically a good sign: new themes that surface mid-week tend to consolidate faster when there's existing signal overlap. I'd flag these for review before Thursday's planning session.`,
  `**Sentiment dipped on Tuesday — weakening themes pulled the score down.**\n\nSeveral themes showed declining confidence this session. Signal volume is still present but the sources are becoming less consistent.\n\nWeakening themes don't always mean the problem is resolved — sometimes it means customers have stopped raising it because they've found workarounds. I'd recommend one more review cycle before archiving any theme.`,
  `**Wednesday saw a meaningful recovery in sentiment.**\n\nCustomer signal strength rebounded, driven primarily by enterprise feedback. Two Gong calls this afternoon added high-confidence signals to existing themes, lifting the weekly average.\n\nThe recovery is real but narrow — it's concentrated in enterprise accounts. SMB sentiment remained flat. Worth watching whether this broadens out by end of week.`,
  `**Thursday was the week's sentiment peak — urgent themes hit high confidence.**\n\nMultiple urgent themes reached peak confidence. Two enterprise accounts flagged critical issues as blockers in the same 24-hour window.\n\n**Recommended action**: these themes are ready to move from insight to roadmap input. The signal quality is high and the ARR impact is significant. I'd suggest adding them to Thursday's planning review.`,
  `**Friday showed mixed signals — performance themes are dragging on the overall score.**\n\nMobile parity and canvas performance signals continued to accumulate without resolution, pulling the weekly average down from Thursday's peak. These themes have been active for 3+ weeks without roadmap action.\n\nThe pattern here is worth flagging: sustained unresolved signals tend to generate a second wave of customer frustration. Both themes now have enough signal volume to justify prioritisation conversations.`,
  `**Saturday's data shows strengthening themes sustaining a positive weekly trend.**\n\nThe standout theme is showing consistent confidence growth across the past 5 sessions, driven by repeat signals from different source types — calls, surveys, and community posts.\n\nMulti-source strengthening is a reliable indicator that a theme is real and broad, not a single-account concern. This is the kind of momentum that warrants moving a theme to active development.`,
  `**Sunday closed the week at the overall average — a stable reading.**\n\nNo single theme is dominating sentiment, and the distribution between urgent, strengthening, and weakening themes is broadly balanced.\n\n**Weekly summary**: the week's highlight was Thursday's urgent theme peak. The main risk heading into next week is the unresolved mobile and performance signals accumulating without roadmap response. I'd prioritise those two for the Monday review.`,
]

function AIPanel({ open, onClose, analysisIndex, onClearAnalysis }: { open: boolean; onClose: () => void; analysisIndex: number | null; onClearAnalysis: () => void }) {
  if (!open) return null

  const analysis = analysisIndex !== null ? SENTIMENT_ANALYSIS[analysisIndex] : null
  const dayLabel = analysisIndex !== null ? DAY_LABELS[analysisIndex] : null

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
          {analysis && (
            <button onClick={onClearAnalysis} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
              <svg width="8" height="14" viewBox="0 0 8 14" fill="none">
                <path d="M7 1L1 7L7 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: '#E7E7E5' }}>
            <span className="text-[#222428] leading-[0] flex items-center justify-center">
              <IconSparksFilled css={{ width: 16, height: 16 }} />
            </span>
          </div>
          <p className="text-[#222428] text-[18px] font-heading font-medium" style={{ fontFamily: 'Roobert, sans-serif' }}>
            Insights Assistant
          </p>
        </div>
        <button onClick={onClose} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Body */}
      <div key={analysisIndex ?? 'default'} className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${analysis ? '' : 'justify-end'}`}>
        {analysis ? (
          <motion.div
            key={analysisIndex}
            className="flex flex-col gap-6 px-4 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* User bubble */}
            <motion.div className="flex justify-end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                <p className="text-[14px] text-[#222428]">View analysis for {dayLabel}</p>
              </div>
            </motion.div>

            {/* AI response */}
            <motion.div className="flex items-start gap-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: '#E7E7E5' }}>
                <span className="text-[#222428] leading-[0] flex items-center justify-center">
                  <IconSparksFilled css={{ width: 14, height: 14 }} />
                </span>
              </div>
              <div className="flex-1 flex flex-col gap-3">
                {analysis.split('\n\n').map((para, i) => (
                  <motion.p
                    key={i}
                    className="text-[14px] text-[#222428] leading-[1.6]"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: 0.35 + i * 0.08 }}
                  >
                    {para.split(/\*\*(.*?)\*\*/g).map((part, j) =>
                      j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                    )}
                  </motion.p>
                ))}
                <motion.div
                  className="flex flex-col gap-2 mt-2"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.8 }}
                >
                  <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
                    {PROMPT_CHIPS.map((chip) => (
                      <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                        <span className="text-gray-400 flex-shrink-0 leading-[0]"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
                        <span className="text-gray-900">{chip}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-6 px-4">
            <div className="flex flex-col gap-2">
              <p className="text-[#222428] text-[28px] font-serif leading-[1.4]">Hi, Kajsa</p>
              <div className="text-[#656b81] text-[16px] leading-[1.5]">
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
            <div className="-mx-4 rounded-[24px] overflow-hidden py-1.5" style={{ backgroundColor: '#FBFAF7' }}>
              {PROMPT_CHIPS.map((chip) => (
                <button key={chip} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors">
                  <span className="text-gray-400 flex-shrink-0 leading-[0]"><IconSparksFilled css={{ width: 16, height: 16 }} /></span>
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function InsightsOverviewPage() {
  const [aiOpen, setAiOpen] = useState(false)
  const [analysisIndex, setAnalysisIndex] = useState<number | null>(null)

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 488 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          {/* Overview section */}
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0, 0, 1] }}
            className="rounded-[24px] p-8 pt-[132px] mb-[60px] relative min-h-[390px] shadow-sm"
            style={{ backgroundColor: 'white' }}
            aria-labelledby="overview-heading"
          >

            <div className="absolute bottom-8 left-8">
              <div
                className="flex items-center justify-center flex-shrink-0 overflow-hidden mb-4"
                style={{ width: 64, height: 64, borderRadius: 20, boxShadow: 'rgba(34,36,40,0.06) 0px 1px 4px', backgroundColor: 'rgba(34,36,40,0.08)' }}
              >
                <span className="inline-flex items-center justify-center flex-shrink-0 text-[#222428]" style={{ width: 38, height: 38 }}>
                  <IconFlag css={{ width: 24, height: 24 }} />
                </span>
              </div>
              <h1 id="overview-heading" className="text-[60px] font-serif text-[#222428] mb-3">
                Overview
              </h1>
              <p className="text-[20px] text-[#222428]/70 max-w-md leading-relaxed">
                Gain a high-level overview of key insights, emerging trends, and important updates.
              </p>
            </div>
          </motion.section>

          {/* Metric cards */}
          <div className={`grid gap-4 mb-[60px] ${aiOpen ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            <MetricCard
              label="Feature adoption"
              value="+8.5%"
              sub="20%"
              background="#f1fecf"
              description={
                <>
                  New suggestion added{' '}
                  <Link href="/insights/themes/9" className="underline text-[#222428] font-medium ">
                    Visual Polish Improvements.
                  </Link>
                </>
              }
            />
            <MetricCard
              label="Active Users"
              value="+12.1%"
              sub="13,444"
              background="#dce8ff"
              description={
                <>
                  New theme added{' '}
                  <Link href="/insights/themes/5" className="underline text-[#222428] font-medium ">
                    Canvas Performance
                  </Link>
                </>
              }
            />
            <MetricCard
              label="New Users"
              value="+8.3%"
              sub="532"
              background="#ffd8f4"
              description={
                <>
                  Driven by{' '}
                  <Link href="/insights/themes/4" className="underline text-[#222428] font-medium ">
                    AI features,
                  </Link>{' '}
                  <Link href="/insights/themes/30" className="underline text-[#222428] font-medium ">
                    Onboarding flow.
                  </Link>
                </>
              }
            />
            <MetricCard
              label="Average Session"
              value="-30 secs"
              sub="15m"
              background="#f8d3af"
              description="Decline led by resolved mobile crash on board entry."
            />
          </div>

          {/* Charts row */}
          <div className={`grid gap-4 mb-6 ${aiOpen ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
            <SentimentChart onOpenChat={(index) => { setAnalysisIndex(index); setAiOpen(true) }} />
            <ThemeMatrix />
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
      <AIPanel open={aiOpen} onClose={() => { setAiOpen(false); setAnalysisIndex(null) }} analysisIndex={analysisIndex} onClearAnalysis={() => setAnalysisIndex(null)} />

    </div>
  )
}
