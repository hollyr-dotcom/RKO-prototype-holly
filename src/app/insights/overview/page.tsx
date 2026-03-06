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
import { TrendingMentions } from '@/components/insights/TrendingMentions'
import { VolatileSignals } from '@/components/insights/VolatileSignals'
import { ChatInput } from '@/components/toolbar/ChatInput'

// ─── AI Panel ─────────────────────────────────────────────────────────────────

const PROMPT_CHIPS = [
  'Give me a more detailed update',
  'Tell me about items in triage',
  'Add triage items to ideas',
]

// Analysis data lives in SentimentChart — import the day labels for display
const DAY_LABELS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

const METRIC_ANALYSIS: Record<string, { prompt: string; response: string }> = {
  'Feature adoption': {
    prompt: 'Analyse feature adoption (+8.5%)',
    response: `**Feature adoption is up 8.5% — driven largely by AI and template usage.**\n\nThe growth is concentrated in two areas: AI sticky note clustering (used by 34% of active teams this week, up from 26%) and the template library (new mid-market accounts are adopting templates at 2x the rate of existing users).\n\n**What's working**: The new onboarding flow is surfacing AI features earlier. Teams that encounter clustering in their first session have a 60% higher 30-day retention rate.\n\n**Watch**: Adoption growth is uneven — enterprise accounts above 100 seats are lagging at +2.1%, likely due to the canvas performance issues flagged in the Strengthening themes. Resolving that may unlock a second wave of enterprise adoption.`,
  },
  'Active Users': {
    prompt: 'Analyse active users (+12.1%)',
    response: `**Active users are up 12.1% — the strongest weekly growth in 6 weeks.**\n\nThe spike is driven by two factors: a product hunt mention on Tuesday that brought in 1,200 new signups, and a re-engagement campaign targeting lapsed users that reactivated 840 accounts.\n\n**Segment breakdown**: SMB accounts account for 70% of the new actives. Enterprise accounts are growing more slowly (+3.4%) — consistent with the pattern seen last quarter when canvas performance was first flagged as a blocker.\n\n**Recommendation**: The reactivation campaign ROI is strong enough to warrant a second wave targeting users who churned 60–90 days ago. I'd also flag that new active users from the Product Hunt spike have lower board creation rates — worth monitoring 7-day retention for this cohort.`,
  },
  'New Users': {
    prompt: 'Analyse new users (+8.3%)',
    response: `**New user growth is up 8.3%, with AI features and onboarding improvements as the primary drivers.**\n\nSignals from the past 7 days point to two themes driving acquisition:\n\n**AI features** — organic mentions of AI clustering and summarisation on LinkedIn and Reddit are generating referral traffic. 18% of new signups this week cited "AI capabilities" in the onboarding survey.\n\n**Onboarding flow** — the revised first-session experience (shorter time-to-first-board) has improved activation from 41% to 54% for new signups.\n\n**Risk**: Conversion from free to paid for this cohort is tracking at 6.2%, below the 8.5% baseline. New users are engaging but not yet finding the moment that drives upgrade. Worth reviewing the paywall trigger timing.`,
  },
  'Average Session': {
    prompt: 'Analyse average session (−30 secs)',
    response: `**Average session length is down 30 seconds — likely a positive signal, not a negative one.**\n\nThe decline follows the resolution of a mobile crash on board entry that was forcing users to reload. Sessions that previously included a crash-and-reload cycle were inflating average duration artificially.\n\n**Adjusted baseline**: Excluding crash-affected sessions, the underlying session length trend is flat to slightly positive (+4 seconds week-over-week).\n\n**What to watch**: Canvas performance signals are still accumulating for large boards. If the rendering bottleneck worsens, we'd expect a genuine session length decline as users abandon large-board workflows. Current data doesn't show this yet — but it's worth tracking alongside the Canvas Performance theme confidence score.`,
  },
  'Volatile Signals': {
    prompt: 'Analyse most volatile themes',
    response: `**Three themes are showing significant confidence movement this period — one rising fast, two worth monitoring.**\n\nThe fastest-moving theme has seen a meaningful confidence shift driven by repeat signals across multiple source types: Gong calls, survey responses, and community posts. Multi-source movement is typically a reliable indicator that momentum is real, not noise.\n\n**Rising themes** are gaining consistent signal and represent good candidates to move forward in the roadmap. The signal quality is high enough to warrant prioritisation conversations this sprint.\n\n**Falling themes** may be stabilising or losing urgency — customers could have found workarounds, or the problem may be seasonal. I'd recommend one more review cycle before archiving either, and checking whether any roadmap action in the last 30 days could explain the drop.\n\n**Recommended action**: review the rising theme in Thursday's planning session. The confidence trajectory makes it a strong candidate for the next roadmap input cycle.`,
  },
  'Customer Sentiment': {
    prompt: 'Analyse customer sentiment this week',
    response: `**Customer sentiment tracked at an average of 83% confidence across all active themes this week — stable overall, with a notable peak on Thursday.**\n\nThursday's spike was driven by urgent themes hitting high confidence simultaneously, with two enterprise accounts flagging critical blockers in the same 24-hour window. That kind of clustered signal is a strong indicator that the underlying problem is real and broad.\n\n**The dip on Tuesday** reflects weakening themes losing signal consistency — not necessarily resolved, but customers may be finding workarounds. Worth one more review cycle before archiving.\n\n**Friday's mixed reading** is the most actionable signal heading into next week. Mobile and canvas performance themes have been accumulating signal for 3+ weeks without roadmap response. Sustained unresolved signals tend to generate a second wave of frustration — both are ready for prioritisation conversations.`,
  },
  'Trending Mentions': {
    prompt: 'Analyse trending mentions',
    response: `**Notion integration leads with 94 mentions and is the fastest-growing theme by volume this period.**\n\nCanvas performance has the highest growth rate at +18%, despite lower absolute mentions. This pattern — rising rate with lower volume — typically precedes a breakout. If the trajectory holds, canvas performance could dominate next week's count.\n\n**The top 3 themes together account for 72% of all mentions.** This level of concentration is worth flagging — it means a small number of themes are driving almost all feedback signal, which can mask emerging issues in the long tail.\n\nAI shape suggestions and Async video comments are early-stage but consistent. They've appeared in every weekly summary for the past 3 weeks without significant volume growth — worth watching as potential slow-burn signals before they accelerate.`,
  },
  'Theme Matrix': {
    prompt: 'Analyse theme matrix',
    response: `**The matrix reveals a clear split between high-value quick wins and complex strategic investments.**\n\nMobile editing and Notion integration sit in the high-effort, high-confidence quadrant — strong signals worth serious investment despite the complexity. Both have maintained confidence above 85% for multiple weeks.\n\n**Unlimited undo and Mind map mode are the clearest quick wins** — low effort, high confidence, and neither has roadmap action yet. These could move fast with minimal resourcing and would generate positive customer signal quickly.\n\n3 themes flagged Urgent cluster in the mid-confidence range, suggesting customer pressure may be outpacing validated demand. I'd recommend a signal quality review before committing roadmap resources to any of them — urgency from a small number of loud accounts doesn't always reflect broad customer need.`,
  },
}


const SENTIMENT_ANALYSIS = [
  `**Monday opened with new signal momentum.**\n\nNew opportunities emerged from customer calls and market signals — notably around early-stage UX patterns and emerging product gaps. Early confidence scores are moderate but climbing.\n\nThis is typically a good sign: new opportunities that surface mid-week tend to consolidate faster when there's existing signal overlap. I'd flag these for review before Thursday's planning session.`,
  `**Sentiment dipped on Tuesday — weakening opportunities pulled the score down.**\n\nSeveral opportunities showed declining confidence this session. Signal volume is still present but the sources are becoming less consistent.\n\nWeakening opportunities don't always mean the problem is resolved — sometimes it means customers have stopped raising it because they've found workarounds. I'd recommend one more review cycle before archiving any opportunity.`,
  `**Wednesday saw a meaningful recovery in sentiment.**\n\nCustomer signal strength rebounded, driven primarily by enterprise feedback. Two Gong calls this afternoon added high-confidence signals to existing opportunities, lifting the weekly average.\n\nThe recovery is real but narrow — it's concentrated in enterprise accounts. SMB sentiment remained flat. Worth watching whether this broadens out by end of week.`,
  `**Thursday was the week's sentiment peak — urgent opportunities hit high confidence.**\n\nMultiple urgent opportunities reached peak confidence. Two enterprise accounts flagged critical issues as blockers in the same 24-hour window.\n\n**Recommended action**: these opportunities are ready to move from insight to roadmap input. The signal quality is high and the ARR impact is significant. I'd suggest adding them to Thursday's planning review.`,
  `**Friday showed mixed signals — performance opportunities are dragging on the overall score.**\n\nMobile parity and canvas performance signals continued to accumulate without resolution, pulling the weekly average down from Thursday's peak. These opportunities have been active for 3+ weeks without roadmap action.\n\nThe pattern here is worth flagging: sustained unresolved signals tend to generate a second wave of customer frustration. Both opportunities now have enough signal volume to justify prioritisation conversations.`,
  `**Saturday's data shows strengthening opportunities sustaining a positive weekly trend.**\n\nThe standout opportunity is showing consistent confidence growth across the past 5 sessions, driven by repeat signals from different source types — calls, surveys, and community posts.\n\nMulti-source strengthening is a reliable indicator that an opportunity is real and broad, not a single-account concern. This is the kind of momentum that warrants moving an opportunity to active development.`,
  `**Sunday closed the week at the overall average — a stable reading.**\n\nNo single opportunity is dominating sentiment, and the distribution between urgent, strengthening, and weakening opportunities is broadly balanced.\n\n**Weekly summary**: the week's highlight was Thursday's urgent opportunity peak. The main risk heading into next week is the unresolved mobile and performance signals accumulating without roadmap response. I'd prioritise those two for the Monday review.`,
]

function AIPanel({ open, onClose, analysisIndex, onClearAnalysis, metricKey, onClearMetric }: { open: boolean; onClose: () => void; analysisIndex: number | null; onClearAnalysis: () => void; metricKey?: string | null; onClearMetric?: () => void }) {
  if (!open) return null

  const analysis = analysisIndex !== null ? SENTIMENT_ANALYSIS[analysisIndex] : null
  const dayLabel = analysisIndex !== null ? DAY_LABELS[analysisIndex] : null
  const metricData = metricKey ? METRIC_ANALYSIS[metricKey] : null
  const activeAnalysis = metricData?.response ?? analysis
  const activePrompt = metricData?.prompt ?? (dayLabel ? `View analysis for ${dayLabel}` : null)
  const onClearActive = metricData ? onClearMetric : onClearAnalysis

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
          {activeAnalysis && (
            <button onClick={onClearActive} className="w-6 h-6 flex items-center justify-center text-[#656b81] hover:text-[#222428] transition-colors">
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
      <div key={metricKey ?? analysisIndex ?? 'default'} className={`flex-1 overflow-y-auto flex flex-col px-6 pb-0 pt-24 ${activeAnalysis ? '' : 'justify-end'}`}>
        {activeAnalysis ? (
          <motion.div
            key={metricKey ?? analysisIndex}
            className="flex flex-col gap-6 px-4 pb-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* User bubble */}
            <motion.div className="flex justify-end" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
              <div className="max-w-[80%] bg-[#f1f2f5] rounded-[12px] px-4 py-3">
                <p className="text-[14px] text-[#222428]">{activePrompt}</p>
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
                {activeAnalysis.split('\n\n').map((para, i) => (
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
  const [metricKey, setMetricKey] = useState<string | null>(null)

  const openMetric = (key: string) => { setMetricKey(key); setAnalysisIndex(null); setAiOpen(true) }

  return (
    <div className="relative h-full w-full flex flex-col" style={{ backgroundColor: '#FBFAF7' }}>
      <InsightsTopBar />

      <div
        className="flex-1 overflow-y-auto"
        style={{ paddingRight: aiOpen ? 488 : 0, transition: 'padding-right 0.25s ease' }}
      >
        <main className="px-0 py-[60px] mx-[60px]">

          {/* Overview heading */}
          <div className="flex items-center justify-between mb-[60px]">
            <div>
              <h1 className="text-[72px] font-serif text-[#222428] leading-none">Overview</h1>
            </div>
            <p className="text-[20px] text-[#222428]/70 max-w-sm leading-relaxed text-right">
              Gain a high-level overview of key insights, emerging trends, and important updates.
            </p>
          </div>

          {/* Metric cards */}
          <div className={`grid gap-4 mb-9 ${aiOpen ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'}`}>
            <MetricCard
              label="Feature adoption"
              value="+8.5%"
              sub="20%"
              background="#ADF0C7"
              onOpenChat={() => openMetric('Feature adoption')}
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
              background="#C6DCFF"
              onOpenChat={() => openMetric('Active Users')}
              description={
                <>
                  New opportunity added{' '}
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
              background="#FFD8F4"
              onOpenChat={() => openMetric('New Users')}
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
              background="#F8D3AF"
              onOpenChat={() => openMetric('Average Session')}
              description="Decline led by resolved mobile crash on board entry."
            />
          </div>

          {/* Charts row */}
          <div className={`grid mb-9 ${aiOpen ? 'grid-cols-1 gap-9' : 'grid-cols-2 gap-9'}`}>
            <SentimentChart onOpenChat={(index) => { setAnalysisIndex(index); setAiOpen(true) }} onOpenChatHeader={() => openMetric('Customer Sentiment')} />
            <ThemeMatrix onOpenChat={() => openMetric('Theme Matrix')} />
          </div>

          {/* Second charts row */}
          <div className={`grid mb-9 ${aiOpen ? 'grid-cols-1 gap-9' : 'grid-cols-2 gap-9'}`}>
            <TrendingMentions onOpenChat={() => openMetric('Trending Mentions')} />
            <VolatileSignals onOpenChat={() => openMetric('Volatile Signals')} />
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
      <AIPanel open={aiOpen} onClose={() => { setAiOpen(false); setAnalysisIndex(null); setMetricKey(null) }} analysisIndex={analysisIndex} onClearAnalysis={() => setAnalysisIndex(null)} metricKey={metricKey} onClearMetric={() => setMetricKey(null)} />

    </div>
  )
}
