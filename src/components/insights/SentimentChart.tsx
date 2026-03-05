'use client'

import React, { useState, useRef } from 'react'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { HelpCircle } from 'lucide-react'
import { THEME_CARDS } from '@/data/themes-data'

// ─── Derive sentiment from real theme data ────────────────────────────────────

function avgConf(cards: typeof THEME_CARDS) {
  if (!cards.length) return 0
  return Math.round(cards.reduce((s, c) => s + parseInt(c.meta.confidence), 0) / cards.length)
}

const urgentThemes    = THEME_CARDS.filter(c => c.tags.some(t => t.label === 'Urgent'))
const strengtheningThemes = THEME_CARDS.filter(c => c.tags.some(t => t.label === 'Strengthening'))
const weakeningThemes = THEME_CARDS.filter(c => c.tags.some(t => t.label === 'Weakening'))
const newThemes       = THEME_CARDS.filter(c => c.tags.some(t => t.label === 'New'))

const overallAvg      = avgConf(THEME_CARDS)          // ~83
const weakeningAvg    = avgConf(weakeningThemes)       // ~67
const urgentAvg       = avgConf(urgentThemes)          // ~93
const strengtheningAvg = avgConf(strengtheningThemes)  // ~85
const newAvg          = avgConf(newThemes)             // ~82
const mixedAvg        = Math.round((weakeningAvg + overallAvg) / 2) // ~75

const data = [
  {
    day: 'M',
    value: newAvg,
    insight: `${newThemes.length} new themes surfacing — early momentum building across customer calls.`,
    quote: `"${newThemes[0].title}"`,
    analysis: `**Monday opened with new signal momentum.**\n\n${newThemes.length} new themes emerged from customer calls and market signals — notably around ${newThemes[0].title} and ${newThemes[1]?.title ?? 'emerging UX patterns'}. Early confidence scores are moderate but climbing.\n\nThis is typically a good sign: new themes that surface mid-week tend to consolidate faster when there's existing signal overlap. I'd flag these for review before Thursday's planning session.`,
  },
  {
    day: 'T',
    value: weakeningAvg,
    insight: `${weakeningThemes.length} weakening themes pulled sentiment down this session.`,
    quote: `"${weakeningThemes[0].title}"`,
    analysis: `**Sentiment dipped on Tuesday — ${weakeningThemes.length} themes are weakening.**\n\n${weakeningThemes.map(t => `**${t.title}**`).join(' and ')} both showed declining confidence this session. Signal volume is still present but the sources are becoming less consistent.\n\nWeakening themes don't always mean the problem is resolved — sometimes it means customers have stopped raising it because they've found workarounds. I'd recommend one more review cycle before archiving either theme.`,
  },
  {
    day: 'W',
    value: Math.round((overallAvg + newAvg) / 2),
    insight: 'Recovery driven by customer signal strength and new enterprise feedback.',
    quote: `"${THEME_CARDS[3].title}"`,
    analysis: `**Wednesday saw a meaningful recovery in sentiment.**\n\nCustomer signal strength rebounded, driven primarily by enterprise feedback on ${THEME_CARDS[3].title}. Two Gong calls this afternoon added high-confidence signals to existing themes, lifting the weekly average.\n\nThe recovery is real but narrow — it's concentrated in enterprise accounts. SMB sentiment remained flat. Worth watching whether this broadens out by end of week.`,
  },
  {
    day: 'TH',
    value: urgentAvg,
    insight: `${urgentThemes.length} urgent themes reached peak confidence — action recommended.`,
    quote: `"${urgentThemes[0].title}"`,
    analysis: `**Thursday was the week's sentiment peak — ${urgentThemes.length} urgent themes hit high confidence.**\n\n${urgentThemes[0].title} reached ${urgentThemes[0].meta.confidence} confidence — the highest of any active theme this week. Two enterprise accounts flagged it as a blocker in the same 24-hour window.\n\n**Recommended action**: this theme is ready to move from insight to roadmap input. The signal quality is high and the ARR impact is significant. I'd suggest adding it to Thursday's planning review.`,
  },
  {
    day: 'F',
    value: mixedAvg,
    insight: 'Mixed signals — mobile and performance themes dragging on overall score.',
    quote: `"${THEME_CARDS[6].title}"`,
    analysis: `**Friday showed mixed signals — two themes are dragging on overall sentiment.**\n\nMobile parity and canvas performance signals continued to accumulate without resolution, pulling the weekly average down from Thursday's peak. These themes have been active for 3+ weeks without roadmap action.\n\nThe pattern here is worth flagging: sustained unresolved signals tend to generate a second wave of customer frustration. Both themes now have enough signal volume to justify prioritisation conversations.`,
  },
  {
    day: 'S',
    value: strengtheningAvg,
    insight: `${strengtheningThemes.length} strengthening themes sustaining a positive weekly trend.`,
    quote: `"${strengtheningThemes[0].title}"`,
    analysis: `**Saturday's data shows ${strengtheningThemes.length} themes strengthening week over week.**\n\n${strengtheningThemes[0].title} is the standout — confidence has climbed consistently across the past 5 sessions, driven by repeat signals from different source types (calls, surveys, community posts).\n\nMulti-source strengthening is a reliable indicator that a theme is real and broad, not a single-account concern. This is the kind of momentum that warrants moving a theme to active development.`,
  },
  {
    day: 'S',
    value: overallAvg,
    insight: 'Overall sentiment aligned with average confidence across all active themes.',
    quote: `"${THEME_CARDS[0].title}"`,
    analysis: `**Sunday closed the week at the overall average — ${overallAvg}% confidence across all active themes.**\n\nThis is a stable reading. No single theme is dominating sentiment, and the distribution between urgent, strengthening, and weakening themes is broadly balanced.\n\n**Weekly summary**: the week's highlight was Thursday's urgent theme peak. The main risk heading into next week is the unresolved mobile and performance signals accumulating without roadmap response. I'd prioritise those two for the Monday review.`,
  },
]

// ─── Popover ──────────────────────────────────────────────────────────────────

interface HoveredDot {
  cx: number
  cy: number
  index: number
}

function SentimentPopover({
  cx,
  cy,
  index,
  onOpenChat,
  onMouseEnter,
  onMouseLeave,
}: HoveredDot & { onOpenChat?: (index: number) => void; onMouseEnter: () => void; onMouseLeave: () => void }) {
  const point = data[index]
  if (!point) return null

  return (
    <div
      className="absolute z-50"
      style={{
        left: cx,
        top: cy,
        transform: 'translate(-50%, calc(-100% - 16px))',
        width: 374,
        paddingBottom: 24,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="rounded-[8px] p-4 flex flex-col gap-3"
        style={{
          backgroundColor: '#1a1b1e',
          boxShadow: '0px 8px 32px rgba(5,0,56,0.12)',
        }}
      >
        <div className="flex flex-col gap-1">
          <p className="text-lg font-heading font-medium text-white leading-snug mb-1">
            {point.insight}
          </p>
        </div>

        <div
          className="rounded-[8px] px-4 py-3 flex items-center gap-3"
          style={{ backgroundColor: '#2b2d33' }}
        >
          <div className="w-0.5 self-stretch bg-white opacity-30 shrink-0" />
          <p className="text-[12px] text-white leading-[1.5] line-clamp-2 opacity-80">
            {point.quote}
          </p>
        </div>

        <div>
          <button
            onClick={() => onOpenChat?.(index)}
            className="px-4 py-1.5 rounded-[6px] text-white text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#3859FF' }}
          >
            View analysis
          </button>
        </div>

      </div>

    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SentimentChart({ onOpenChat }: { onOpenChat?: (index: number) => void }) {
  const [hoveredDot, setHoveredDot] = useState<HoveredDot | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHoveredDot(null), 800)
  }

  const cancelClose = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  const renderActiveDot = (props: any) => {
    const { cx, cy, index } = props
    return (
      <circle
        key={`dot-${index}`}
        cx={cx}
        cy={cy}
        r={7}
        fill="#3859FF"
        stroke="white"
        strokeWidth={2}
        onMouseEnter={() => { cancelClose(); setHoveredDot({ cx, cy, index }) }}
        onMouseLeave={scheduleClose}
        style={{ cursor: 'pointer' }}
      />
    )
  }

  return (
    <section className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug">Customer sentiment</h2>
          <HelpCircle className="w-5 h-5 text-gray-400" />
        </div>
        <p className="text-sm text-gray-500">
          Based on confidence scores across {THEME_CARDS.length} active themes · avg {overallAvg}%
        </p>
      </div>
      <figure className="flex-1 min-h-[450px] relative">
        {hoveredDot && (
          <SentimentPopover
            cx={hoveredDot.cx}
            cy={hoveredDot.cy}
            index={hoveredDot.index}
            onOpenChat={onOpenChat}
            onMouseEnter={cancelClose}
            onMouseLeave={scheduleClose}
          />
        )}
        <ResponsiveContainer width="100%" height={450}>
          <AreaChart
            data={data}
            margin={{ top: 16, right: 0, left: 16, bottom: 0 }}
            onMouseLeave={scheduleClose}
          >
            <defs>
              <linearGradient id="sentimentGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3859FF" stopOpacity={0.45} />
                <stop offset="100%" stopColor="#3859FF" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'inherit' }}
              dy={10}
            />
            <YAxis
              domain={[0, 100]}
              ticks={[0, 25, 50, 75, 100]}
              axisLine={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#9ca3af', fontFamily: 'inherit' }}
              orientation="right"
              dx={14}
              width={42}
            />
            <Tooltip
              content={() => null}
              cursor={{ stroke: '#c7d2fe', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3859FF"
              strokeWidth={2}
              fill="url(#sentimentGradient)"
              dot={{ fill: '#3859FF', strokeWidth: 0, r: 5, fillOpacity: 1 }}
              activeDot={renderActiveDot}
            />
          </AreaChart>
        </ResponsiveContainer>
        <figcaption className="sr-only">
          Customer sentiment chart derived from confidence scores across {THEME_CARDS.length} themes
        </figcaption>
      </figure>
    </section>
  )
}
