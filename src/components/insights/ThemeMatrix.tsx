'use client'

import React, { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
} from 'recharts'
import { IconSmileyChat, IconGlobe, IconExclamationPointCircle, IconChartLine, IconArrowDown, IconSparksFilled, IconRocket, IconThumbsUp, IconChatLinesTwo } from '@mirohq/design-system-icons'
import { THEME_CARDS, type ThemeCard } from '@/data/themes-data'

// ─── Popover ──────────────────────────────────────────────────────────────────

interface HoveredDot { cx: number; cy: number; card: ThemeCard }

function ThemeMatrixPopover({ cx, cy, card, onMouseEnter, onMouseLeave }: HoveredDot & { onMouseEnter: () => void; onMouseLeave: () => void }) {
  const router = useRouter()
  const flipRight = cx < 160
  return (
    <div
      className="absolute z-50"
      style={{
        left: cx,
        top: cy,
        transform: flipRight ? 'translate(-16px, calc(-100% - 16px))' : 'translate(-50%, calc(-100% - 16px))',
        width: 330,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="rounded-[8px] px-5 py-4 flex flex-col gap-4" style={{ backgroundColor: '#1a1b1e', boxShadow: '0px 8px 32px rgba(5,0,56,0.12)' }}>
        <div className="flex items-center gap-1.5 flex-wrap">
          {card.tags.map((t) => <TagPill key={t.label} label={t.label} />)}
        </div>
        <div className="flex flex-col gap-1">
          <p className="text-lg font-heading font-medium text-white leading-snug mb-1 line-clamp-2">{card.title}</p>
          <p className="text-[13px] text-white leading-[1.4] opacity-70 line-clamp-2">{card.description}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[13px] text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <span>{card.meta.arr}</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[13px] text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <IconRocket css={{ width: 14, height: 14 }} />
            <span>{card.meta.confidence}</span>
            <span className="text-[11px] text-[#aeb2c0]">{card.meta.confidenceDelta}</span>
          </div>
          <div className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[13px] text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
            <IconThumbsUp css={{ width: 14, height: 14 }} />
            <span>{card.meta.likes}</span>
          </div>
          {card.meta.comments !== undefined && (
            <div className="flex items-center gap-1 h-7 px-2.5 rounded-[6px] text-[13px] text-white" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
              <IconChatLinesTwo css={{ width: 14, height: 14 }} />
              <span>{card.meta.comments}</span>
            </div>
          )}
        </div>
        <div>
          <button
            onClick={() => router.push(`/insights/themes/${card.id}`)}
            className="px-4 py-1.5 rounded-[6px] text-sm font-medium transition-opacity hover:opacity-80"
            style={{ backgroundColor: '#ffffff', color: '#222428', border: '1px solid #e0e2e8' }}
          >
            View details
          </button>
        </div>
      </div>
    </div>
  )
}


// ─── Tag pills ───────────────────────────────────────────────────────────────

const TAG_PILL_COLORS: Record<string, string> = {
  New: '#ADF0C7',
  Urgent: '#FFD8F4',
  Customer: '#FFF6B6',
  Market: '#C6DCFF',
  Strengthening: '#F8D3AF',
  Weakening: '#DEDAFF',
}

function GiftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
      <rect x="2" y="7" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1 7h14v2H1z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7V15" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M8 7C8 7 6 5.5 5.5 4.5C5 3.5 5.5 2 7 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M8 7C8 7 10 5.5 10.5 4.5C11 3.5 10.5 2 9 2C8 2 8 3.5 8 7Z" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round" />
    </svg>
  )
}

function TagPill({ label }: { label: string }) {
  const bg = TAG_PILL_COLORS[label] ?? '#e9eaef'
  return (
    <span
      className="flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium text-[#222428]"
      style={{ backgroundColor: bg }}
    >
      {label === 'New' && <GiftIcon />}
      {label === 'Customer' && <IconSmileyChat css={{ width: 12, height: 12 }} />}
      {label === 'Market' && <IconGlobe css={{ width: 12, height: 12 }} />}
      {label === 'Urgent' && <IconExclamationPointCircle css={{ width: 12, height: 12 }} />}
      {label === 'Strengthening' && <IconChartLine css={{ width: 12, height: 12 }} />}
      {label === 'Weakening' && <IconArrowDown css={{ width: 12, height: 12 }} />}
      {label}
    </span>
  )
}

// ─── Effort axis values per theme ────────────────────────────────────────────
// Higher effort = more engineering complexity. Derived from feature scope.
const EFFORT: Record<string, number> = {
  '1': 40,  // Jira custom fields
  '2': 70,  // Adoption plateau
  '3': 25,  // Portfolio view
  '4': 45,  // AI sticky clustering
  '5': 55,  // Cursor lag (bug)
  '6': 80,  // Template library depth
  '7': 90,  // Mobile editing
  '8': 50,  // Async video comments
  '9': 65,  // Smart shape suggestions
  '10': 45, // Guest access
  '11': 35, // Presentation mode
  '12': 32, // Cross-board search (bug)
  '13': 20, // Unlimited undo
  '14': 75, // Nested frames
  '15': 40, // Custom brand palettes
  '16': 28, // Comment threading
  '17': 70, // Notion integration
  '18': 65, // Session recording
  '19': 72, // Advanced table widget
  '20': 55, // AI meeting facilitation
  '21': 15, // Keyboard shortcuts
  '22': 30, // Board loading time (bug)
  '23': 42, // Custom fonts
  '24': 68, // WCAG AA compliance
  '25': 85, // Offline mode
  '26': 38, // Live voting/polling
  '27': 92, // Pricing jump
  '28': 88, // Real-time translation
  '29': 18, // Mind map mode
  '30': 22, // Sprint planning templates
}

const TAG_DOT_COLORS: Record<string, string> = {
  Urgent: '#FFD8F4',
  Weakening: '#DEDAFF',
  Strengthening: '#F8D3AF',
  New: '#ADF0C7',
  Customer: '#FFF6B6',
  Market: '#C6DCFF',
}

function getDotColor(card: ThemeCard) {
  // Priority: Urgent > Weakening > Strengthening > first tag
  const labels = card.tags.map((t) => t.label)
  if (labels.includes('Urgent')) return TAG_DOT_COLORS['Urgent']
  if (labels.includes('Weakening')) return TAG_DOT_COLORS['Weakening']
  if (labels.includes('Strengthening')) return TAG_DOT_COLORS['Strengthening']
  return TAG_DOT_COLORS[labels[0]] ?? '#FFF6B6'
}

const scatterData = THEME_CARDS.map((card) => ({
  effort: EFFORT[card.id] ?? 50,
  value: parseInt(card.meta.confidence, 10),
  card,
}))

// ─── Main component ───────────────────────────────────────────────────────────

export function ThemeMatrix({ onOpenChat }: { onOpenChat?: () => void }) {
  const [cardHovered, setCardHovered] = useState(false)
  const [hoveredDot, setHoveredDot] = useState<HoveredDot | null>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleClose = () => { closeTimer.current = setTimeout(() => setHoveredDot(null), 300) }
  const cancelClose = () => { if (closeTimer.current) { clearTimeout(closeTimer.current); closeTimer.current = null } }

  const renderDot = (props: any) => {
    const { cx, cy, payload } = props
    const color = getDotColor(payload.card)
    const isHovered = hoveredDot?.card.id === payload.card.id
    return (
      <g key={`dot-${payload.card.id}`}>
        {isHovered && <circle cx={cx} cy={cy} r={14} fill={color} opacity={0.25} />}
        <circle
          cx={cx} cy={cy}
          r={isHovered ? 10 : 6}
          fill={color}
          style={{ cursor: 'pointer', transition: 'r 0.15s ease' }}
          onMouseEnter={() => { cancelClose(); setHoveredDot({ cx, cy, card: payload.card }) }}
          onMouseLeave={scheduleClose}
        />
      </g>
    )
  }

  return (
    <section
      className="bg-white rounded-[24px] border border-gray-100 shadow-sm p-8 flex flex-col h-full"
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">Theme Matrix</h2>
          <p className="text-sm text-gray-500">Confidence vs implementation effort</p>
        </div>
        <AnimatePresence>
          {cardHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={onOpenChat}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors"
              style={{
                backgroundColor: 'transparent',
                border: '1.5px solid #e0e2e8',
                color: '#222428',
              }}
            >
              <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
        {[
          { label: 'Urgent', color: '#FFD8F4' },
          { label: 'Strengthening', color: '#F8D3AF' },
          { label: 'Weakening', color: '#DEDAFF' },
          { label: 'New', color: '#ADF0C7' },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[12px] text-[#656b81]">{label}</span>
          </div>
        ))}
      </div>

      <figure className="flex-1 min-h-[300px] flex flex-col relative">
        {hoveredDot && (
          <ThemeMatrixPopover
            cx={hoveredDot.cx} cy={hoveredDot.cy} card={hoveredDot.card}
            onMouseEnter={cancelClose} onMouseLeave={scheduleClose}
          />
        )}
        <div className="flex flex-1 border-b border-gray-200">
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <XAxis type="number" dataKey="effort" domain={[0, 100]} hide />
                <YAxis type="number" dataKey="value" domain={[60, 100]} hide />
                <Scatter data={scatterData} shape={renderDot} />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-col w-8 shrink-0 pt-8 pb-2 border-l border-gray-200">
            <span className="text-[12px] text-gray-400 leading-none pl-2">100%</span>
            <div className="flex-1 flex items-center justify-center">
              <span className="text-[14px] font-heading font-semibold -rotate-90 whitespace-nowrap text-[#222428]">
                Confidence
              </span>
            </div>
            <span className="text-[12px] text-gray-400 leading-none pl-2">60%</span>
          </div>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-[12px] text-gray-400">Low effort</span>
          <span className="text-[14px] font-heading font-semibold text-[#222428]">
            Effort
          </span>
          <span className="text-[12px] text-gray-400">High effort</span>
        </div>
        <figcaption className="sr-only">
          Theme Matrix scatter plot showing confidence vs implementation effort for each theme
        </figcaption>
      </figure>
    </section>
  )
}
