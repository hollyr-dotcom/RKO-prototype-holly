'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { THEME_CARDS } from '@/data/themes-data'
import { IconSparksFilled } from '@mirohq/design-system-icons'

// ─── Data ─────────────────────────────────────────────────────────────────────

function getVolatileThemes(count = 3) {
  return [...THEME_CARDS]
    .map(t => ({ ...t, deltaNum: parseInt(t.meta.confidenceDelta.replace('%', '')) }))
    .sort((a, b) => Math.abs(b.deltaNum) - Math.abs(a.deltaNum))
    .slice(0, count)
}

function buildSeries(confidenceStr: string, deltaNum: number): number[] {
  const end = parseInt(confidenceStr.replace('%', ''))
  const start = Math.max(0, Math.min(100, end - deltaNum))
  return Array.from({ length: 7 }, (_, i) => {
    const t = i / 6
    const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
    const base = start + (end - start) * ease
    return Math.round(Math.max(10, Math.min(99, base)))
  })
}

const TAG_COLORS: Record<string, string> = {
  Urgent: '#FFD8F4',
  Weakening: '#DEDAFF',
  Strengthening: '#F8D3AF',
  New: '#BADEB1',
  Customer: '#FFF6B6',
  Market: '#C6DCFF',
}

function getThemeColor(theme: ReturnType<typeof getVolatileThemes>[number]): string {
  const labels = theme.tags.map(t => t.label)
  for (const priority of ['Urgent', 'Weakening', 'Strengthening', 'New', 'Customer', 'Market']) {
    if (labels.includes(priority)) return TAG_COLORS[priority]
  }
  return TAG_COLORS[labels[0]] ?? '#C6DCFF'
}

const DATES = ['12/13', '12/20', '12/27', '1/02', '1/09', '1/16', '1/23']

// ─── SVG constants ────────────────────────────────────────────────────────────

const W = 460
const H = 220
const PL = 6
const PR = 36
const PT = 8
const PB = 20
const CW = W - PL - PR
const CH = H - PT - PB

const Y_MIN = 0
const Y_MAX = 100
const TICKS = [0, 25, 50, 75, 100]

function yp(v: number) { return PT + CH - ((v - Y_MIN) / (Y_MAX - Y_MIN)) * CH }

// ─── Component ────────────────────────────────────────────────────────────────

export function VolatileSignals({ onOpenChat }: { onOpenChat?: () => void }) {
  const router = useRouter()
  const themes = getVolatileThemes(3)
  const series = themes.map(t => buildSeries(t.meta.confidence, t.deltaNum))
  const [hovered, setHovered] = useState<number | null>(null)
  const [hoveredBar, setHoveredBar] = useState<{ si: number; di: number } | null>(null)
  const [cardHovered, setCardHovered] = useState(false)

  const numDates = DATES.length
  const numSeries = series.length
  const groupW = CW / numDates
  const barW = Math.floor(groupW * 0.2)
  const barGap = 2
  const groupPad = (groupW - numSeries * barW - (numSeries - 1) * barGap) / 2
  const baseY = yp(Y_MIN)

  return (
    <div
      className="bg-white rounded-[24px] border border-gray-100 shadow-sm flex flex-col gap-4 p-8 relative h-full"
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-heading font-medium text-gray-900 leading-snug mb-1">
            Most volatile opportunities
          </h2>
          <p className="text-sm text-gray-500">Based on % change in confidence score</p>
        </div>

        {/* Sparkle button — shows on hover, opens AI chat */}
        <AnimatePresence>
          {cardHovered && (
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              onClick={() => onOpenChat?.()}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors text-[#222428]"
              style={{ border: '1.5px solid #e0e2e8' }}
            >
              <span className="leading-[0]"><IconSparksFilled css={{ width: 14, height: 14 }} /></span>
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Chart */}
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: 'visible', display: 'block' }}>

        {/* Y-axis ticks */}
        {TICKS.map(tick => (
          <text key={tick} x={W - PR + 8} y={yp(tick) + 4} fontSize={10} fill="#959aac" textAnchor="start">{tick}</text>
        ))}

        {/* Bars */}
        {series.map((vals, si) =>
          vals.map((v, di) => {
            const x = PL + di * groupW + groupPad + si * (barW + barGap)
            const barH = Math.max(4, baseY - yp(v))
            const top = yp(v)
            const r = Math.min(4, barW / 2, barH / 2)
            const d = `M${x},${top + baseY - top} L${x},${top + r} Q${x},${top} ${x + r},${top} L${x + barW - r},${top} Q${x + barW},${top} ${x + barW},${top + r} L${x + barW},${top + baseY - top} Z`
            const isActive = hovered === null || hovered === si
            return (
              <path
                key={`${si}-${di}`}
                d={d}
                fill={getThemeColor(themes[si])}
                opacity={isActive ? 1 : 0.15}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => { setHovered(si); setHoveredBar({ si, di }) }}
                onMouseLeave={() => { setHovered(null); setHoveredBar(null) }}
                onClick={() => router.push(`/insights/themes/${themes[si].id}`)}
              />
            )
          })
        )}

        {/* Hover tooltip */}
        {hoveredBar && (() => {
          const { si, di } = hoveredBar
          const v = series[si][di]
          const x = PL + di * groupW + groupPad + si * (barW + barGap) + barW / 2
          const y = yp(v) - 8
          const label = themes[si].meta.confidenceDelta
          const tw = label.length * 7 + 16
          return (
            <g pointerEvents="none">
              <rect x={x - tw / 2} y={y - 20} width={tw} height={22} rx={4} fill="#222428" />
              <text x={x} y={y - 5} fill="white" fontSize={11} fontWeight={500} textAnchor="middle">{label}</text>
            </g>
          )
        })()}

        {/* Axis border lines */}
        <line x1={W - PR} y1={PT} x2={W - PR} y2={baseY} stroke="#e9eaef" strokeWidth={1} />
        <line x1={PL} y1={baseY} x2={W - PR} y2={baseY} stroke="#e9eaef" strokeWidth={1} />

        {/* X-axis date labels */}
        {DATES.map((d, i) => (
          <text
            key={d}
            x={PL + i * groupW + groupW / 2}
            y={H - 4}
            fontSize={10}
            fill="#959aac"
            textAnchor="middle"
          >{d}</text>
        ))}
      </svg>

      {/* Legend */}
      <div className="flex flex-col">
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            className="flex items-center gap-2.5 text-left px-3 py-1 rounded-[10px] transition-colors"
            style={{ backgroundColor: hovered === i ? '#f1f2f5' : 'transparent' }}
            onClick={() => router.push(`/insights/themes/${theme.id}`)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: getThemeColor(themes[i]) }}
            />
            <span
              className="text-[13px] leading-snug truncate flex-1 transition-colors"
              style={{ color: hovered === i ? '#222428' : '#656b81' }}
            >
              {theme.title}
            </span>
          </button>
        ))}
      </div>

    </div>
  )
}
