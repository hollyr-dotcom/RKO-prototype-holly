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

const BAR_COLORS = ['#3859FF', '#7B9BFF', '#C5D4FF']

const DATES = ['12/13', '12/20', '12/27', '1/02', '1/09', '1/16', '1/23']

// ─── SVG constants ────────────────────────────────────────────────────────────

const W = 460
const H = 190
const PL = 6
const PR = 36
const PT = 8
const PB = 22
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
      className="bg-white rounded-[12px] flex flex-col gap-4 p-8 relative"
      style={{ boxShadow: '0px 4px 20px rgba(34,36,40,0.08)' }}
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
          <text key={tick} x={W - PR + 6} y={yp(tick) + 4} fontSize={10} fill="#959aac" textAnchor="start">{tick}</text>
        ))}

        {/* Bars */}
        {series.map((vals, si) =>
          vals.map((v, di) => {
            const x = PL + di * groupW + groupPad + si * (barW + barGap)
            const barH = Math.max(2, baseY - yp(v))
            const isActive = hovered === null || hovered === si
            return (
              <rect
                key={`${si}-${di}`}
                x={x}
                y={yp(v)}
                width={barW}
                height={barH}
                rx={3}
                fill={BAR_COLORS[si]}
                opacity={isActive ? 1 : 0.15}
                style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
                onMouseEnter={() => setHovered(si)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => router.push(`/insights/themes/${themes[si].id}`)}
              />
            )
          })
        )}

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
      <div className="flex flex-col gap-1">
        {themes.map((theme, i) => (
          <button
            key={theme.id}
            className="flex items-center gap-2.5 text-left px-3 py-2 rounded-[10px] transition-colors"
            style={{ backgroundColor: hovered === i ? '#f1f2f5' : 'transparent' }}
            onClick={() => router.push(`/insights/themes/${theme.id}`)}
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
          >
            <span
              className="w-2.5 h-2.5 rounded-sm shrink-0"
              style={{ backgroundColor: BAR_COLORS[i] }}
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
