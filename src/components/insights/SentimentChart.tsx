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
  },
  {
    day: 'T',
    value: weakeningAvg,
    insight: `${weakeningThemes.length} weakening themes pulled sentiment down this session.`,
    quote: `"${weakeningThemes[0].title}"`,
  },
  {
    day: 'W',
    value: Math.round((overallAvg + newAvg) / 2),
    insight: 'Recovery driven by customer signal strength and new enterprise feedback.',
    quote: `"${THEME_CARDS[3].title}"`,
  },
  {
    day: 'TH',
    value: urgentAvg,
    insight: `${urgentThemes.length} urgent themes reached peak confidence — action recommended.`,
    quote: `"${urgentThemes[0].title}"`,
  },
  {
    day: 'F',
    value: mixedAvg,
    insight: 'Mixed signals — mobile and performance themes dragging on overall score.',
    quote: `"${THEME_CARDS[6].title}"`,
  },
  {
    day: 'S',
    value: strengtheningAvg,
    insight: `${strengtheningThemes.length} strengthening themes sustaining a positive weekly trend.`,
    quote: `"${strengtheningThemes[0].title}"`,
  },
  {
    day: 'S',
    value: overallAvg,
    insight: 'Overall sentiment aligned with average confidence across all active themes.',
    quote: `"${THEME_CARDS[0].title}"`,
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
}: HoveredDot & { onOpenChat?: () => void; onMouseEnter: () => void; onMouseLeave: () => void }) {
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
          <p className="text-[20px] font-serif text-white leading-[1.4]">
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

        <div className="flex justify-end">
          <button
            onClick={onOpenChat}
            className="px-4 py-1.5 rounded-[6px] text-white text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#3859FF' }}
          >
            View analysis
          </button>
        </div>
      </div>

      {/* Caret */}
      <div
        className="absolute left-1/2 -translate-x-1/2"
        style={{
          bottom: -9,
          width: 0,
          height: 0,
          borderLeft: '12px solid transparent',
          borderRight: '12px solid transparent',
          borderTop: '9px solid #1a1b1e',
        }}
      />
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SentimentChart({ onOpenChat }: { onOpenChat?: () => void }) {
  const [hoveredDot, setHoveredDot] = useState<HoveredDot | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = () => {
    closeTimer.current = setTimeout(() => setHoveredDot(null), 300)
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
    <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-[24px] font-serif text-[#222428]">Customer sentiment</h2>
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
